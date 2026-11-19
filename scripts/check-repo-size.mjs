import { execFileSync } from "node:child_process";
import { statSync, existsSync } from "node:fs";
const paths = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], {
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/);
const files = [...new Set(paths)]
  .filter((p) => p && existsSync(p))
  .map((path) => ({ path, bytes: statSync(path).size }));
const bytes = files.reduce((n, f) => n + f.bytes, 0);
console.log(
  JSON.stringify(
    {
      files: files.length,
      bytes,
      limit: 8000000,
      largest: files.sort((a, b) => b.bytes - a.bytes).slice(0, 10),
    },
    null,
    2,
  ),
);
if (bytes >= 8000000) process.exitCode = 1;
