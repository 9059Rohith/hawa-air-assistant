import { z } from "zod";
const schema = z.object({
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  LLM_BASE_URL: z
    .enum([
      "https://api.openai.com/v1",
      "https://openrouter.ai/api/v1",
      "https://api.groq.com/openai/v1",
    ])
    .default("https://api.openai.com/v1"),
  LLM_TIMEOUT_MS: z.coerce.number().int().min(1000).max(20000).default(20000),
  LLM_MAX_OUTPUT_TOKENS: z.coerce
    .number()
    .int()
    .min(256)
    .max(1800)
    .default(1400),
  LLM_TOKEN_BUDGET_PER_MIN: z.coerce
    .number()
    .int()
    .min(256)
    .max(200000)
    .default(24000),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().min(1).max(60).default(12),
  ENABLE_LLM: z.enum(["true", "false"]).default("true"),
  APP_ORIGIN: z.string().url().default("http://localhost:3100"),
});
export function env() {
  return schema.parse(process.env);
}
