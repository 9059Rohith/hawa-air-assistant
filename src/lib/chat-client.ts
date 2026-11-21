import type { Plan, Profile } from "@/domain/types";
import { consumeChatStream, type ChatEvent } from "./chat-stream";

export type ChatHistoryEntry = {
  role: "user" | "assistant";
  content: string;
};
type ChatInput = {
  plan: Plan;
  profile: Profile;
  message: string;
  messages: ChatHistoryEntry[];
};

/** Owns the HTTP contract; the hook owns whether a reply is still current. */
export async function requestChat(
  { plan, profile, message, messages }: ChatInput,
  signal: AbortSignal,
  onEvent: (event: ChatEvent) => void,
) {
  signal.throwIfAborted();
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(30000)]);
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      profile: { ...plan.profile, lang: profile.lang, simple: profile.simple },
      location: plan.location,
      manualPm: plan.air.pm25,
      message,
      offline: false,
      messages: messages.slice(-6),
      actionIds: plan.actions.map((action) => action.id),
    }),
    signal: deadline,
  });
  const mediaType = response.headers
    .get("Content-Type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (!response.ok || !response.body || mediaType !== "text/event-stream") {
    void response.body?.cancel().catch(() => undefined);
    throw new Error("Chat service returned an invalid response");
  }
  await consumeChatStream(response.body, deadline, onEvent);
}
