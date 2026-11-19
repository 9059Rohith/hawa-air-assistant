import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// All user plans are dynamic; application caches are bounded and process-local.
// No durable ISR cache or additional paid storage is required.
export default defineCloudflareConfig();
