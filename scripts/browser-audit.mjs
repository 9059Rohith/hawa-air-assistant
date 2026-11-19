import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const axe = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const browser = await chromium.launch({ channel: "msedge" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const checks = [];
mkdirSync("artifacts", { recursive: true });
mkdirSync("reports", { recursive: true });
try {
  for (const route of ["/", "/plan", "/community", "/learn", "/about"]) {
    await page.goto(`http://localhost:3100${route}`);
    for (const theme of ["light", "dark", "hc"]) {
      await page.getByLabel("Theme").selectOption(theme);
      await page.evaluate(axe);
      const violations = await page.evaluate(async () =>
        (
          await window.axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
            },
          })
        ).violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
        })),
      );
      checks.push({ route, theme, violations });
    }
    if (route === "/") {
      await page.getByLabel("Theme").selectOption("light");
      await page.screenshot({
        path: "artifacts/home-desktop.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 360, height: 800 });
      await page.screenshot({
        path: "artifacts/home-mobile.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }
  const result = { checks, errors, measuredAt: new Date().toISOString() };
  writeFileSync(
    "reports/browser-accessibility.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify({
      states: checks.length,
      violations: checks.reduce((n, c) => n + c.violations.length, 0),
      errors,
    }),
  );
  if (checks.some((c) => c.violations.length) || errors.length)
    process.exitCode = 1;
} finally {
  await browser.close();
}
