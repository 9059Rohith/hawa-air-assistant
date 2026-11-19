# Verified quality report — 19 November 2026

Observed software evidence, not an evaluation-score or ranking prediction.

| Check                                        | Current release result                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Strict TypeScript                            | Pass                                                                                                         |
| ESLint + Prettier                            | Pass                                                                                                         |
| Unit/component/API tests                     | **103 passed**                                                                                               |
| Entire production source coverage            | **90.99% lines**, 89.50% statements, 84.45% branches, 85.50% functions                                       |
| Domain coverage                              | **100% lines, statements, branches and functions** for AQI, emissions, impact, safety, selection and schemas |
| Production build + OpenNext Worker packaging | Pass                                                                                                         |
| Desktop/mobile end-to-end tests              | **14 passed**, including 320px keyboard/offline journey and script-size gate                                 |
| axe                                          | **15 page/theme states, zero detected violations**                                                           |
| Runtime errors in browser audit              | **0**                                                                                                        |
| Text/surface contrast                        | All 12 checked pairs exceed 4.5:1                                                                            |
| Modern home JavaScript                       | **120,196 gzip bytes (117.4 KiB)**; budget 133,120 bytes                                                     |
| Dependency audit                             | **0 reported vulnerabilities**                                                                               |
| Working-tree and Git-history secret patterns | **0 matches**; 291 historical blobs scanned before this release commit                                       |
| Build artifact credential scan               | **0 matches across 44 files**                                                                                |
| Submission source                            | Approximately **0.85 MB**, below 10 MB; source-size gate is stricter at 8 MB                                 |
| Local .git directory                         | Approximately **1.15 MB**, including local verification helpers/logs                                         |
| Hosted CI                                    | Workflow active; GitHub account billing lock prevents job execution                                          |

Coverage includes unexecuted route shells; low-coverage files are not hidden. Full coverage means tested code paths, not proof of medical accuracy. CI runs contrast checks before browser tests and includes the browser JavaScript-size gate.

## What changed in this release

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

## Public release verification

Final release version 8, source `4acac19`, passed all **14 production browser tests** and **15 axe page/theme checks** with zero detected violations or runtime errors. A real OpenAI plan returned ten actions and retained curated transport explanations. A fresh public-repository checkout passed all 103 tests.

The final mobile Lighthouse run measured **85 performance / 100 accessibility / 81 best practices / 100 SEO**, FCP **1.38 s**, LCP **1.47 s**, TBT **563 ms**, CLS **0**. An earlier version-6 run measured 99 performance and LCP 1.69 s. These are individual lab runs, not a guaranteed loading time. The best-practices deprecation finding comes from the hosting platform’s `/cdn-cgi/challenge-platform/scripts/jsd/main.js`; platform security controls were retained.

One version-7 full browser run passed 13/14 after the mobile air-to-plan journey lost state during navigation; its cause was not established. That test passed three targeted repetitions, then the final release passed the full 14-test suite with one worker. This history is retained in `reports/production-e2e.json`; it is not proof that intermittent failures are impossible.

Real browser Open-Meteo Delhi data was separately observed at 115.9 µg/m³ (source time 2026-11-19T18:30 Asia/Kolkata). Its dated report identifies the version tested.

## External requirements and honest limits

- The public application and repository use the existing links in README. Vercel/Railway account restrictions do not block this Sites deployment.
- GitHub's billing lock must be resolved by the account owner before hosted CI can execute. Local checks are not presented as hosted CI success.
- LinkedIn publication is excluded by the owner. The submission portal may require that field before the owner can submit.
- The public captioned demo was refreshed from the deployed application (3 minutes 8 seconds), including loaded-page offline planning, community tools and calculators. It uses labelled manual data and rules mode; real AI is verified separately.
- Independent NVDA/VoiceOver and professional Hindi review are not claimed. Some source names and technical explanations remain English.
- No medical validation, empirical local calibration, full regulatory certification, or Docker runtime verification is claimed.
- Loaded-page offline use works; first visits and uncached page loads need internet. No service-worker installation claim is made.
- A key pasted into conversation should be rotated through its provider account. No key value is in committed source or packaged artifacts.

The core problem statement is implemented and locally verified. External account actions and the deliberately excluded social post prevent an unqualified claim that every submission prerequisite is complete. See [traceability](TRACEABILITY.md) for the detailed brief and justified design boundaries.
