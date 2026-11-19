import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({resolve:{alias:{"@":fileURLToPath(new URL("./src",import.meta.url))}},test:{environment:"jsdom",include:["tests/**/*.test.{ts,tsx}"],coverage:{provider:"v8",include:["src/domain/**/*.ts","src/services/**/*.ts","src/lib/**/*.ts","src/components/**/*.tsx"],reporter:["text","json-summary"],thresholds:{lines:85,"src/domain/**/*.ts":{lines:100,functions:100,branches:100,statements:100}}}}});
