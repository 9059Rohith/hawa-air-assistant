# HAWA submission handoff

Challenge 6: Urban Air Quality Assistant. The core application is implemented, publicly deployed and verified against the problem statement. This is an evidence-based readiness record, not a guarantee of perfection, score or rank.

| Submission item                    | Status / destination                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public source                      | [9059Rohith/hawa-air-assistant](https://github.com/9059Rohith/hawa-air-assistant)                                                                             |
| Public application                 | [Open HAWA](https://hawa-air-assistant.vabjashwanthreddy.chatgpt.site)                                                                                        |
| Public narrated and captioned demo | [Watch the 3:08 demonstration](https://drive.google.com/file/d/1rtsSNE5ervJveCU9nqPGF8UceikRsiU0/view)                                                        |
| Repository size                    | Approximately 0.87 MB of submission source; below the 10 MB limit                                                                                             |
| Implementation coverage            | [Original-brief traceability](TRACEABILITY.md), with explicit modelling and hosting decisions                                                                 |
| Verification                       | 103 tests, 100% domain coverage, 90.99% overall line coverage; 14 public desktop/mobile browser tests; 15 axe page/theme states with zero detected violations |
| Build, lint and strict types       | Passed; production Worker deployed as version 8 from `4acac19a5fa59fce0db07d6261e6a2f8504e77f6`                                                               |
| Live integrations                  | Actual OpenAI plan verified on final release; browser Open-Meteo success separately recorded with source timestamp                                            |
| GitHub CI                          | Workflow activated, but GitHub blocks all job steps because of the account billing lock                                                                       |
| Hack2skill draft                   | GitHub, deployment, demo, changes and GenAI fields filled; final Submit has not been clicked                                                                  |
| LinkedIn                           | Deliberately excluded by the owner; the portal marks this field required                                                                                      |

The refreshed demo replaced the existing Drive file version without changing its public link. The sharing dialog confirms **Anyone with the link — Viewer**. It records labelled manual data and loaded-page offline rules mode; the separate real AI check is not portrayed as part of that recording.

See [the quality report](QUALITY_REPORT.md) for dated measurements, an earlier intermittent browser-test failure, subsequent passing runs, accessibility review limits and the platform-managed Lighthouse finding. Documentation/evidence commits after the deployed source revision do not change the application bundle.

The owner must supply the excluded LinkedIn field if required by the portal and perform final submission. Resolving the GitHub billing lock is an account-owner action; local passing checks are not described as a successful hosted CI run.
