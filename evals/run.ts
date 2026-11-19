import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { evaluateScenarios } from "./scenarios";
const start = performance.now();
const cases = evaluateScenarios();
const result = {
  measuredAt: new Date().toISOString(),
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  workingTreeDirty: !!execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
  }).trim(),
  mode: "Offline deterministic acceptance evaluation; no model calls",
  modelCalls: 0,
  total: cases.length,
  passed: cases.filter((c) => c.passed).length,
  failed: cases.filter((c) => !c.passed).length,
  assertions: cases.reduce((n, c) => n + Object.keys(c.checks).length, 0),
  durationMs: Math.round(performance.now() - start),
  limitations:
    "These cases check software contracts and scenarios; they do not measure live model quality, medical validity or a competition score.",
  cases,
};
mkdirSync("reports", { recursive: true });
writeFileSync("reports/scenarios.json", JSON.stringify(result, null, 2) + "\n");
console.log(
  JSON.stringify({
    total: result.total,
    passed: result.passed,
    failed: result.failed,
    assertions: result.assertions,
    modelCalls: 0,
  }),
);
if (result.failed) {
  console.error(JSON.stringify(cases.filter((c) => !c.passed)));
  process.exitCode = 1;
}
