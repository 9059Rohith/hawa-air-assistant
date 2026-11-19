import { expect, it } from "vitest";
import { evaluateScenarios } from "../evals/scenarios";
const cases = evaluateScenarios();
it.each(cases)("acceptance case: $id", ({ checks }) => {
  for (const [name, passed] of Object.entries(checks))
    expect(passed, name).toBe(true);
});
