import { env } from "../src/config/env";
const config = env();
console.info({
  node: process.versions.node,
  environmentValid: true,
  aiConfigured: Boolean(config.LLM_API_KEY),
  enabled: config.ENABLE_LLM === "true",
});
