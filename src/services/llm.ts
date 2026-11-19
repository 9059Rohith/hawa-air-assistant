import { z } from "zod";
import { TokenBudget, estimateReservation } from "./token-budget";
import { detectInjection } from "@/lib/guard";
import { readJsonResponse } from "@/lib/streams";
import { env } from "@/config/env";
import { safeFetch } from "./http";
import type { Action, Profile } from "@/domain/types";
import {
  createLanguagePayload,
  parseLanguage,
  groundLanguage,
  type LanguageOutput,
} from "./llm-contract";
export { SYSTEM, PROMPT_VERSION, parseLanguage } from "./llm-contract";
const envelope = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().max(20000) }) }))
    .min(1)
    .max(5),
});
const budget = new TokenBudget();
let active = 0;
type Attempt =
  { kind: "success"; writing: LanguageOutput } | { kind: "retry" | "stop" };
async function requestLanguage(
  payload: ReturnType<typeof createLanguagePayload>,
  actions: Action[],
  profile: Profile,
  config: ReturnType<typeof env>,
  signal: AbortSignal,
): Promise<Attempt> {
  try {
    const response = await safeFetch(
      config.LLM_BASE_URL + "/chat/completions",
      {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${config.LLM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      12000,
    );
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      return {
        kind:
          response.status === 429 || response.status >= 500 ? "retry" : "stop",
      };
    }
    const json = envelope.parse(await readJsonResponse(response, signal));
    const first = json.choices[0];
    if (!first) return { kind: "stop" };
    const output = parseLanguage(
      first.message.content,
      actions.map((action) => action.id),
    );
    return {
      kind: "success",
      writing: groundLanguage(output, actions, profile.lang),
    };
  } catch {
    return { kind: signal.aborted ? "stop" : "retry" };
  }
}
/** Bounded model orchestration; schemas and prompt construction live in llm-contract. */
export async function language(
  actions: Action[],
  profile: Profile,
  question?: string,
  context?: unknown,
  signal?: AbortSignal,
) {
  const config = env();
  if (
    !config.LLM_API_KEY ||
    config.ENABLE_LLM === "false" ||
    active >= 3 ||
    (question && detectInjection(question))
  )
    return null;
  const deadline = AbortSignal.any([
    AbortSignal.timeout(config.LLM_TIMEOUT_MS),
    ...(signal ? [signal] : []),
  ]);
  const payload = createLanguagePayload(
    actions,
    profile,
    config,
    question,
    context,
  );
  const reservation = estimateReservation(
    payload.messages,
    config.LLM_MAX_OUTPUT_TOKENS,
  );
  active++;
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (
        deadline.aborted ||
        !budget.reserve(reservation, config.LLM_TOKEN_BUDGET_PER_MIN)
      )
        return null;
      const result = await requestLanguage(
        payload,
        actions,
        profile,
        config,
        deadline,
      );
      if (result.kind === "success") return result.writing;
      if (result.kind === "stop") return null;
      if (attempt === 0)
        await new Promise((resolve) => setTimeout(resolve, 350));
    }
    return null;
  } finally {
    active--;
  }
}
