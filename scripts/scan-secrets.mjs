import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
const pattern = new RegExp(
  "sk-" +
    "(?:proj-)?[A-Za-z0-9_-]{30,}|ghp_" +
    "[A-Za-z0-9]{30,}|github_pat_" +
    "[A-Za-z0-9_]{50,}|AKIA" +
    "[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
);
const paths = [
  ...new Set(
    execFileSync("git", ["ls-files", "-co", "--exclude-standard"], {
      encoding: "utf8",
    })
      .trim()
      .split(/\r?\n/),
  ),
];
const matchedFiles = paths.filter(
  (p) => p && existsSync(p) && pattern.test(readFileSync(p, "utf8")),
);
const objects = execFileSync("git", ["rev-list", "--objects", "--all"], {
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/)
  .map((line) => line.split(" ")[0]);
const types = execFileSync(
  "git",
  ["cat-file", "--batch-check=%(objectname) %(objecttype)"],
  { input: objects.join("\n") + "\n", encoding: "utf8" },
)
  .trim()
  .split(/\r?\n/);
let blobs = 0,
  historyMatches = 0;
for (const row of types) {
  const [sha, type] = row.split(" ");
  if (type !== "blob") continue;
  blobs++;
  const content = execFileSync("git", ["cat-file", "blob", sha], {
    encoding: "utf8",
    maxBuffer: 12 * 1024 * 1024,
  });
  if (pattern.test(content)) historyMatches++;
}
const result = {
  workingFiles: paths.length,
  matchedFiles,
  historyBlobs: blobs,
  historyMatches,
  measuredAt: new Date().toISOString(),
};
mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/secret-scan.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result));
if (matchedFiles.length || historyMatches) process.exitCode = 1;
