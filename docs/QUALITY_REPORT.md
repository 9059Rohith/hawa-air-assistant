# Verified quality report — 19 November 2026

Observed software evidence, not an evaluation-score or ranking prediction. The portal was inspected on 19 November 2026: **96.94/100**, rank **#32/53,969**, with **code quality 89** as the lowest category. This follow-up targets maintainability and response handling; a new official score requires owner resubmission.

| Check                                        | Current release result                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Strict TypeScript                            | Pass                                                                                                                |
| ESLint + Prettier                            | Pass                                                                                                                |
| Unit/component/API tests                     | **468 passed (381 unit/component/API/contract + 87 acceptance cases)**                                              |
| Entire production source coverage            | **93.52% lines**, 91.65% statements, 86.45% branches, 90.11% functions                                              |
| Domain coverage                              | **100% lines, statements, branches and functions** for AQI, emissions, impact, safety, selection and schemas        |
| Production build + OpenNext Worker packaging | Pass                                                                                                                |
| Desktop/mobile end-to-end tests              | **38 production tests passed**, including urgent/Hindi chat and 320px keyboard/offline journey and script-size gate |
| axe                                          | **15 page/theme states, zero detected violations**                                                                  |
| Runtime errors in browser audit              | **0**                                                                                                               |
| Text/surface contrast                        | All 12 checked pairs exceed 4.5:1                                                                                   |
| Modern home JavaScript                       | **117,314 gzip bytes (114.6 KiB)**; budget 117,500 bytes                                                            |
| Dependency audit                             | **0 reported vulnerabilities**                                                                                      |
| Working-tree and Git-history secret patterns | **0 matches**; 464 historical blobs scanned before this release commit                                              |
| Build artifact credential scan               | **0 matches across 45 files**                                                                                       |
| Submission source                            | Approximately **1.03 MB**, below 10 MB; source-size gate is stricter at 8 MB                                        |
| Hosted CI                                    | Workflow active; GitHub account billing lock prevents job execution                                                 |

Coverage includes unexecuted route shells; low-coverage files are not hidden. Full coverage means tested code paths, not proof of medical accuracy. CI runs contrast checks before browser tests and includes the browser JavaScript-size gate.

## Six-criterion comparison update

The comparison with Challenge 5 led to stronger cancellation ownership, immediate local urgent guidance, Unicode/punctuation matching, Unicode-aware output guards and feasible travel selection. All 468 Vitest cases pass; 87 of those are also run by an explicit offline evaluator (1,111 checks, zero model calls). Production browser tests pass 38/38. The overall coverage gates now require 90% lines, 85% statements, 80% branches and 80% functions. [Detailed comparison](CHALLENGE_COMPARISON.md).

## Application-wide code-quality pass

All eight remaining functions above complexity 15 were separated into focused components and helpers. The current audit reports **zero functions over 15**, and lint enforces that limit across every application TypeScript/TSX file without suppressions. This extends the earlier service/library gate; those modules also retain nesting and function-length limits. The architecture gate covers 69 modules and 23 client entry points.

Planning lifecycle and bounded response validation now have separate owners. Clipboard absence produces an actionable notice. Household age fields update when the number of children decreases, and blank age entries no longer become newborns. Library search trims surrounding spaces, and purifier feedback explains both room-area and ceiling-height bounds. These behaviors have regression tests.

All **38 production desktop/mobile browser tests** passed, with no failed, skipped or flaky cases.

Version **12** is deployed from `d42a343f837de7b59734823d9400fba61b962a3e` at the same public URL. A real production AI request returned HTTP 200, `generatedBy: llm`, and ten actions in **6,565 ms**. This is one observed sample, not a guaranteed response time. Public axe checks passed all 15 route/theme states with no detected violations or runtime errors; the home payload remains **117,314 gzip bytes**.

## Previous version 11 maintainability follow-up

The source update separates chat lifecycle from rendering, strictly decodes completed SSE messages, bounds upstream response bodies, shares local/server plan assembly and derives the Plan type from its runtime schema. Cache identity now includes source, stale state and forecast context. Exact JSON media types, empty coordinates and child-age/count consistency have regression checks.

The same static audit found 13 functions above complexity 15 before the update and 8 afterwards. Core services/libraries now enforce complexity 15, nesting 3 and 100-line functions; presentation-code exceptions remain visible in `reports/maintainability.json`. The new AST architecture gate checks 67 modules and 22 client roots for local import cycles and forbidden client/server or domain dependencies.

All **34 production browser tests passed** on desktop and mobile with zero failed, skipped or flaky cases.

Version **11** is deployed from `eeded0cadf4a5f49c7eb3612002a6a441e735517` at the unchanged public URL. The real production OpenAI check returned ten actions with `generatedBy: llm` in **6,080 ms**. This is one end-to-end sample, not a guaranteed response time. The home JavaScript payload measured **117,314 gzip bytes** and the public 15-state axe audit found zero violations and runtime errors.

## Previous version 10 testing and efficiency release

Version 10 is deployed from `0982144d016f3535b096765ee3ed5b04c71fda7b`. All **32 production desktop/mobile browser tests** pass. The **403 Vitest cases** comprise 316 unit/component/API/contract cases plus 87 independently recorded acceptance scenarios. Line coverage is **91.89%**, with 100% for the domain. Public axe checks report zero detected violations across 15 states and zero runtime errors.

The home bundle is **117,312 gzip bytes**, down 2,884 bytes from the preceding HAWA release and 338 bytes below Challenge 5. This is a small initial-bundle improvement; the larger efficiency changes are coalescing 50 identical in-flight air requests into one provider call and reserving model cost before every attempt. The home budget is now 117,500 bytes. The measurement includes global error-handler chunks that are not listed in the home/layout build manifest alone.

A real production AI request returned HTTP 200, `generatedBy: llm`, and ten actions in **6,329 ms**. This is one sample, not an under-two-second AI promise. Automated browser regressions use controlled provider responses; their durations cover entire multi-step journeys, not just page load.

New recovery tests exposed and fixed malformed successful plan responses, late responses after Clear/preferences changes, and blocked storage preventing live-state cleanup. Initial new browser selectors were corrected after inspecting failures; no assertions for product behavior were removed. The tightened bundle gate was finalized from actual HTML script accounting.

See `reports/efficiency-review.json`, `reports/production-e2e.json`, `reports/production-ai.json` and [ADR 0006](adr/0006-efficiency-and-recovery.md). Hosted CI remains blocked before any step by GitHub account billing.

## What changed in the preceding feature release

Expanded profile inputs; structured steps/caveats for all 60 bilingual guidance items; forecast chart/table and retrieval age; per-action impact explanations; weekly/adult-commuter scenarios; private-by-design shared links; school/community source checklists; fuel input-energy calculator, DIY safety guide and glossary; persisted theme/language and read-aloud pause; keyboard combobox; local rules planning/chat; bounded chat history/plan/air context; stricter unsafe-prose guards; upload cancellation/deadline; configurable provider limits; sliding-window Retry-After responses; source and history secret scans.

The regression suite caught and fixed an upload-cancellation race. Live AI review also found an unsupported transit/exposure paraphrase. Transport explanations now remain curated; other explanations retain validated AI personalization. Offline browser tests build a plan, ask a grounded question and download JSON without network after the Plan route is loaded. Live-air success and HTTP 429 tests use controlled provider responses; real provider verification is reported separately.

## Reproducible evidence

- `reports/coverage.json`
- `reports/local-e2e.json`
- `reports/browser-accessibility.json`
- `reports/bundle.json`
- `reports/contrast.txt`
- `reports/dependency-audit.json`
- `reports/secret-scan.json`
- `reports/ci.json`
- `reports/production-ai.json`
- `reports/production-e2e.json`
- `reports/fresh-clone.json`
- `reports/demo.json`

Production evidence is refreshed after publication in `reports/production-*.json` and `reports/deployment.json`. Reports retain their timestamps and source revision; earlier measurements are not relabelled as this release.

## Previous version 9 public verification

Version 9 is deployed from `26833dd139945eb176ea0f1e7d39c92d3b0c69c1`. All **16 production desktop/mobile browser tests** pass, including the new urgent/Hindi/failure-recovery journey. All **15 axe page/theme states** report zero detected violations and zero runtime errors. A real browser chat returned `mode: llm` with a curated citation for `mask?`; recognised urgent guidance appeared immediately. The public home bundle remains 120,196 gzip bytes.

See `reports/deployment.json`, `reports/production-e2e.json`, `reports/production-accessibility.json` and `reports/production-chat.json`. The scenario evaluator was rerun from the clean deployed source revision and records that revision with `workingTreeDirty: false`.

## Previous public release verification

Preceding release version 8, source `4acac19`, passed all **14 production browser tests** and **15 axe page/theme checks** with zero detected violations or runtime errors. A real OpenAI plan returned ten actions and retained curated transport explanations. A fresh public-repository checkout passed all 103 tests.

The final mobile Lighthouse run measured **85 performance / 100 accessibility / 81 best practices / 100 SEO**, FCP **1.38 s**, LCP **1.47 s**, TBT **563 ms**, CLS **0**. An earlier version-6 run measured 99 performance and LCP 1.69 s. These are individual lab runs, not a guaranteed loading time. The best-practices deprecation finding comes from the hosting platform’s `/cdn-cgi/challenge-platform/scripts/jsd/main.js`; platform security controls were retained.

One version-7 full browser run passed 13/14 after the mobile air-to-plan journey lost state during navigation; its cause was not established. That test passed three targeted repetitions, then the final release passed the full 14-test suite with one worker. This history is retained in `reports/production-e2e.json`; it is not proof that intermittent failures are impossible.

Real browser Open-Meteo Delhi data was separately observed at 115.9 µg/m³ (source time 2026-11-19T18:30 Asia/Kolkata). Its dated report identifies the version tested.

## External requirements and honest limits

- The public application and repository use the existing links in README. Vercel/Railway account restrictions do not block this Sites deployment.
- GitHub's billing lock must be resolved by the account owner before hosted CI can execute. Local checks are not presented as hosted CI success.
- The owner-provided LinkedIn link is entered in the form, but browser verification found it describes CarbonWise, not HAWA. Replace it with a HAWA-specific post. The portal still shows no assessment results or attempts; final submission remains with the owner.
- The public captioned demo was refreshed from the deployed application (3 minutes 8 seconds), including loaded-page offline planning, community tools and calculators. It uses labelled manual data and rules mode; real AI is verified separately.
- Independent NVDA/VoiceOver and professional Hindi review are not claimed. Some source names and technical explanations remain English.
- No medical validation, empirical local calibration, full regulatory certification, or Docker runtime verification is claimed.
- Loaded-page offline use works; first visits and uncached page loads need internet. No service-worker installation claim is made.
- A key pasted into conversation should be rotated through its provider account. No key value is in committed source or packaged artifacts.

The core problem statement is implemented and verified, and all required form fields are prepared. Official assessment remains pending and hosted CI is blocked by the account billing restriction. A 100% evaluation score or top-1% ranking is not claimed. See [traceability](TRACEABILITY.md) for the detailed brief and justified design boundaries.
