# Verified quality report — 19 November 2026

This report separates observed software results from external account restrictions. It is not an evaluation score or ranking prediction.

| Check                               | Observed result                                                        |
| ----------------------------------- | ---------------------------------------------------------------------- |
| Strict TypeScript                   | Pass                                                                   |
| ESLint + Prettier                   | Pass                                                                   |
| Unit/component/API tests            | 76 passed                                                              |
| Complete production-source coverage | 91.43% lines, 90.68% statements, 86.14% branches, 87.05% functions     |
| Domain coverage                     | 100% lines/statements/branches/functions, enforced                     |
| Desktop/mobile Playwright           | 6 passed                                                               |
| Browser axe                         | 15 route/theme states; zero detected violations                        |
| Browser runtime/hydration errors    | Zero in recorded route audit                                           |
| Contrast checks                     | All 12 tested text/surface pairs exceed 4.5:1                          |
| Production build                    | Pass; Next.js 15.5.29                                                  |
| Actual initial home scripts         | 117,335 gzip bytes; 9 modern-browser scripts; 133,120-byte gate passes |
| Dependency audit                    | Zero vulnerabilities after patched PostCSS override                    |
| Real OpenAI plan                    | HTTP 200; `generatedBy: llm`; 10 validated actions                     |
| Rules fallback                      | API, component and browser tests pass                                  |
| Public source repository            | Created and independently opened as public                             |
| Credential-pattern scan             | No matches; `.env.local` ignored                                       |
| GitHub hosted CI                    | Workflow active; no steps ran because account is locked for billing    |
| Vercel production                   | Blocked before project creation by team fair-use restriction           |

Coverage includes all source files, including unexecuted route shells; the report does not exclude low-coverage UI files. The initial narrower result was replaced by this inclusive result. Build-script size reports exclude `nomodule` assets that modern browsers do not execute. Dynamically loaded validation is fetched when needed, not silently removed.

Local mobile Lighthouse: **95 performance, 100 accessibility, 100 best practices, 100 SEO**. LCP 2.17 seconds; CLS 0. This is a local simulation, not a production latency guarantee. Real geocoding and air endpoints returned HTTP 200 with five search results and 31 forecast hours.

## Evidence

[Public captioned demo](https://drive.google.com/file/d/1rtsSNE5ervJveCU9nqPGF8UceikRsiU0/view) records the local production build. Viewer access is enabled for anyone with the link. Submission source is approximately 0.6 MB, excluding generated media, dependencies and local build artifacts. The Git-history credential-pattern scan covered 130 unique blobs with no matches.

- `reports/coverage.json`
- `reports/bundle.json`
- `reports/browser-accessibility.json`
- `reports/contrast.txt`
- `reports/live-ai.json`
- `reports/live-air.json`
- `reports/lighthouse.json`
- `reports/ci.json`
- `reports/dependency-audit.json`
- `reports/secret-scan.json`
- `reports/deployment.json`

## Open items and limitations

- Resolve the Vercel team restriction, deploy and independently measure the public site. No public latency or Lighthouse score is invented.
- Resolve the GitHub billing lock to obtain an executed hosted CI run.
- A relevant HAWA LinkedIn post URL is needed for the required submission field. An unrelated earlier project post is not evidence for HAWA.
- Independent screen-reader review, fully translated secondary UI, empirical India-specific emissions calibration and a service-worker offline shell remain future work.
- No Docker runtime, full regulatory conformance or medical validation is claimed.
- API key supplied in conversation should be rotated before public production use.

The broad master prompt includes aspirational requirements beyond this implementation. This release is a tested application with transparent limits; it is not described as 100% complete or guaranteed top-ranked.
