import { env } from "@/config/env";
export async function GET() {
  const config = env();
  return Response.json(
    {
      ok: true,
      version: "1.0.0",
      llm:
        config.LLM_API_KEY && config.ENABLE_LLM === "true"
          ? "enabled"
          : "offline",
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
