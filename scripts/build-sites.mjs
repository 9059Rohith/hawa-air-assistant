import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { resolve, relative } from "node:path";

// OpenNext embeds local dotenv files. Keep them out of deployment artifacts;
// production values are configured separately as hosting runtime secrets.
const root = process.cwd();
const backup = resolve(root, ".git/hawa-hosting-env");
mkdirSync(backup, { recursive: true });
const moved = [];
try {
  for (const name of readdirSync(root)) {
    if (!/^\.env(?:\.|$)/.test(name) || name === ".env.example") continue;
    const from = resolve(root, name);
    const to = resolve(backup, name);
    if (relative(root, from) !== name || relative(backup, to) !== name)
      throw new Error("Unsafe environment file path");
    if (existsSync(to))
      throw new Error("Restore prior hosting environment backup first");
    renameSync(from, to);
    moved.push([from, to]);
  }
  for (const args of [
    ["node_modules/next/dist/bin/next", "build"],
    [
      "node_modules/@opennextjs/cloudflare/dist/cli/index.js",
      "build",
      "--skipNextBuild",
    ],
    ["scripts/package-worker.mjs"],
  ])
    execFileSync(process.execPath, args, {
      stdio: "inherit",
      windowsHide: true,
    });
} finally {
  for (const [from, to] of moved.reverse()) renameSync(to, from);
}
