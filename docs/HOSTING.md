# Portable hosting

HAWA retains its Next.js Node server and adds an OpenNext build for Cloudflare Workers, published through Sites. The same application and API code serves both targets.

## Build

```sh
npm ci
npm run build:sites
```

The build compiles Next.js, adapts its server for Workers, bundles the Worker, and copies static assets into `dist/client`. The Worker entry point is `dist/server/index.js`. `.openai/hosting.json` identifies the Site; it contains no credentials. Build artifacts are ignored by Git.

OpenNext ordinarily reads local dotenv files into its output. The build wrapper temporarily moves those files into a checked, ignored directory inside `.git`, restores them in `finally`, and builds without local secrets. If the operating system terminates the build abruptly, restore any files left in `.git/hawa-hosting-env` before rebuilding. Configure `LLM_API_KEY`, `LLM_MODEL`, `ENABLE_LLM` and `APP_ORIGIN` as hosting runtime variables; mark the key as secret.

No database, bucket or durable object is required. Plans are dynamic and responses use `no-store`; application caches and rate limits are bounded but local to each process/isolate. Hashed static assets receive immutable caching. The existing Dockerfile remains an alternative Node deployment path.

The deployment workflow pushes the exact source commit to the Site repository, packages `dist`, saves that version and publishes it. Public access is required for anonymous competition reviewers. Never substitute a local preview or an expected URL for a verified production deployment.

Vercel and Railway rejected deployment under restrictions on the existing accounts. This hosting target uses the separate Sites service; it does not alter or bypass either account restriction. GitHub Actions remains subject to the owner's independent billing lock.
