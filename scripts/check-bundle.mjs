import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
const base = process.env.AUDIT_ORIGIN ?? "http://localhost:3100";
const page = await fetch(base);
if (!page.ok) throw new Error(`Page returned ${page.status}`);
const html = await page.text();
const scripts = [
  ...new Set(
    [...html.matchAll(/<script\b[^>]*>/g)]
      .filter((m) => !/nomodule/i.test(m[0]))
      .map((m) => m[0].match(/src="([^"?]+)/)?.[1])
      .filter((p) => p?.startsWith("/_next/")),
  ),
];
const sizes = await Promise.all(
  scripts.map(async (p) => {
    if (process.env.AUDIT_ORIGIN) {
      const response = await fetch(new URL(p, base));
      if (!response.ok)
        throw new Error(`Script returned ${response.status}: ${p}`);
      return gzipSync(Buffer.from(await response.arrayBuffer())).length;
    }
    return gzipSync(
      readFileSync(".next/" + decodeURIComponent(p.replace("/_next/", ""))),
    ).length;
  }),
);
const bytes = sizes.reduce((sum, n) => sum + n, 0);
const result = {
  route: "/",
  gzipBytes: bytes,
  scripts: scripts.length,
  budget: 117500,
  origin: base,
  measuredAt: new Date().toISOString(),
};
mkdirSync("reports", { recursive: true });
writeFileSync("reports/bundle.json", JSON.stringify(result, null, 2) + "\n");
console.log(result);
if (!scripts.length || bytes > 117500) process.exitCode = 1;
