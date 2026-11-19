import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve, relative } from "node:path";

// Convert OpenNext's output to the Sites Worker + asset archive contract.
// Runtime secrets belong to the host, never the build artifact.
const root = process.cwd();
const output = resolve(root, "dist");
if (relative(root, output) !== "dist") throw new Error("Unsafe output path");
rmSync(output, { recursive: true, force: true });
mkdirSync(resolve(output, "server"), { recursive: true });
execFileSync(
  process.execPath,
  [
    "node_modules/wrangler/bin/wrangler.js",
    "deploy",
    "--dry-run",
    "--outdir",
    "dist/server",
  ],
  { stdio: "inherit", windowsHide: true },
);
renameSync(
  resolve(output, "server/worker.js"),
  resolve(output, "server/index.js"),
);
cpSync(resolve(root, ".open-next/assets"), resolve(output, "client"), {
  recursive: true,
});
mkdirSync(resolve(output, ".openai"), { recursive: true });
cpSync(
  resolve(root, ".openai/hosting.json"),
  resolve(output, ".openai/hosting.json"),
);
const config = JSON.parse(readFileSync(resolve(root, "wrangler.json"), "utf8"));
writeFileSync(
  resolve(output, "server/wrangler.json"),
  JSON.stringify(
    {
      ...config,
      main: "index.js",
      assets: { directory: "../client", binding: "ASSETS" },
    },
    null,
    2,
  ) + "\n",
);
