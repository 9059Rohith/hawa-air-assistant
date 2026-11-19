import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
const paths = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], {
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/);
const pattern = new RegExp(
  "sk-" + "(?:proj-)?[A-Za-z0-9_-]{30,}|ghp_" + "[A-Za-z0-9]{30,}",
);
const matches = [...new Set(paths)].filter(
  (p) => p && existsSync(p) && pattern.test(readFileSync(p, "utf8")),
);
console.log(JSON.stringify({ scanned: paths.length, matchedFiles: matches }));
if (matches.length) process.exitCode = 1;
