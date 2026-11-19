import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
const base = process.env.AUDIT_ORIGIN ?? "http://localhost:3100";
const html = await (await fetch(base)).text();
const scripts = [
  ...new Set(
    [...html.matchAll(/<script\b[^>]*>/g)]
      .filter((m) => !/nomodule/i.test(m[0]))
      .map((m) => m[0].match(/src="([^"?]+)/)?.[1])
      .filter((p) => p?.startsWith("/_next/")),
  ),
];
const bytes = scripts.reduce(
  (n, p) =>
    n +
    gzipSync(
      readFileSync(".next/" + decodeURIComponent(p.replace("/_next/", ""))),
    ).length,
  0,
);
const result = {
  route: "/",
  gzipBytes: bytes,
  scripts: scripts.length,
  budget: 133120,
  measuredAt: new Date().toISOString(),
};
mkdirSync("reports", { recursive: true });
writeFileSync("reports/bundle.json", JSON.stringify(result, null, 2));
console.log(result);
if (!scripts.length || bytes > 133120) process.exitCode = 1;
