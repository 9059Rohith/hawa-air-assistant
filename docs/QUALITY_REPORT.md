# Verified quality report — 19 November 2026

Observed software evidence, not an evaluation-score or ranking prediction.

| Check                                        | Current release result                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Strict TypeScript                            | Pass                                                                                                         |
| ESLint + Prettier                            | Pass                                                                                                         |
| Unit/component/API tests                     | **103 passed**                                                                                               |
| Entire production source coverage            | **91.00% lines**, 89.51% statements, 84.47% branches, 85.50% functions                                       |
| Domain coverage                              | **100% lines, statements, branches and functions** for AQI, emissions, impact, safety, selection and schemas |
| Production build + OpenNext Worker packaging | Pass                                                                                                         |
| Desktop/mobile end-to-end tests              | **14 passed**, including 320px keyboard/offline journey and script-size gate                                 |
| axe                                          | **15 page/theme states, zero detected violations**                                                           |
| Runtime errors in browser audit              | **0**                                                                                                        |
| Text/surface contrast                        | All 12 checked pairs exceed 4.5:1                                                                            |
| Modern home JavaScript                       | **120,196 gzip bytes (117.4 KiB)**; budget 133,120 bytes                                                     |
| Dependency audit                             | **0 reported vulnerabilities**                                                                               |
| Working-tree and Git-history secret patterns | **0 matches**; 206 historical blobs scanned before this release commit                                       |
| Build artifact credential scan               | **0 matches across 44 files**                                                                                |
| Submission source                            | Approximately **0.85 MB**, below 10 MB; source-size gate is stricter at 8 MB                                 |
| Local .git directory                         | Approximately **1.15 MB**, including local verification helpers/logs                                         |
| Hosted CI                                    | Workflow active; GitHub account billing lock prevents job execution                                          |

Coverage includes unexecuted route shells; low-coverage files are not hidden. Full coverage means tested code paths, not proof of medical accuracy. CI runs contrast checks before browser tests and includes the browser JavaScript-size gate.

## What changed in this release

Expanded profile inputs; structured steps/caveats for all 60 bilingual guidance items; forecast chart/table and retrieval age; per-action impact explanations; weekly/adult-commuter scenarios; private-by-design shared links; school/community source checklists; fuel input-energy calculator, DIY safety guide and glossary; persisted theme/language and read-aloud pause; keyboard combobox; local rules planning/chat; bounded chat history/plan/air context; stricter unsafe-prose guards; upload cancellation/deadline; configurable provider limits; sliding-window Retry-After responses; source and history secret scans.

The regression suite caught and fixed an upload-cancellation race. Offline browser tests build a plan, ask a grounded question and download JSON without network after the Plan route is loaded. Live-air success and HTTP 429 tests use controlled provider responses; real provider verification is reported separately.

## Reproducible evidence

- `reports/coverage.json`
- `reports/local-e2e.json`
- `reports/browser-accessibility.json`
- `reports/bundle.json`
- `reports/contrast.txt`
- `reports/dependency-audit.json`
- `reports/secret-scan.json`
- `reports/ci.json`

Production evidence is refreshed after publication in `reports/production-*.json` and `reports/deployment.json`. Reports retain their timestamps and source revision; earlier measurements are not relabelled as this release.

## Previous production baseline

The preceding release had 10 passing production browser tests, zero axe violations over 15 states, a real OpenAI plan with 10 actions, and real browser Open-Meteo Delhi data (115.9 µg/m³ at 2026-11-19T18:30 Asia/Kolkata). Its mobile Lighthouse result was 78 performance / 100 accessibility / 81 best practices / 100 SEO, LCP 1.41 seconds, CLS 0. Host challenge scripts contributed findings. These are historical measurements, not a universal loading-time guarantee or a new-release score.

## External requirements and honest limits

- The public application and repository use the existing links in README. Vercel/Railway account restrictions do not block this Sites deployment.
- GitHub's billing lock must be resolved by the account owner before hosted CI can execute. Local checks are not presented as hosted CI success.
- LinkedIn publication is excluded by the owner. The submission portal may require that field before the owner can submit.
- The public captioned demo records the earlier local production build; its core journey remains representative, but it does not show every new feature.
- Independent NVDA/VoiceOver and professional Hindi review are not claimed. Some source names and technical explanations remain English.
- No medical validation, empirical local calibration, full regulatory certification, or Docker runtime verification is claimed.
- Loaded-page offline use works; first visits and uncached page loads need internet. No service-worker installation claim is made.
- A key pasted into conversation should be rotated through its provider account. No key value is in committed source or packaged artifacts.

The core problem statement is implemented and locally verified. External account actions and the deliberately excluded social post prevent an unqualified claim that every submission prerequisite is complete. See [traceability](TRACEABILITY.md) for the detailed brief and justified design boundaries.
