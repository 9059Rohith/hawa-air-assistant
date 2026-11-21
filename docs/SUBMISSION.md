# HAWA submission handoff

Challenge 6: Urban Air Quality Assistant. The core application is implemented, publicly deployed and verified against the problem statement. All required submission fields are prepared. On 19 November 2026 the portal showed **96.94/100**, **rank #32/53,969**, and **1/3 attempts used**. Category scores: code quality 89, security 99, efficiency 100, testing 98, accessibility 99, problem alignment 100. The maintainability follow-up has not been re-evaluated; a 99 score or top placement is not guaranteed.

| Submission item                    | Status / destination                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public source                      | [9059Rohith/hawa-air-assistant](https://github.com/9059Rohith/hawa-air-assistant)                                                                                                                |
| Public application                 | [Open HAWA](https://hawa-air-assistant.vabjashwanthreddy.chatgpt.site)                                                                                                                           |
| Public narrated and captioned demo | [Watch the 3:08 demonstration](https://drive.google.com/file/d/1rtsSNE5ervJveCU9nqPGF8UceikRsiU0/view)                                                                                           |
| Repository size                    | Approximately 1.1 MB of submission source; below the 10 MB limit                                                                                                                                 |
| Implementation coverage            | [Original-brief traceability](TRACEABILITY.md), with explicit modelling and hosting decisions                                                                                                    |
| Verification                       | 528 Vitest cases (including 87 acceptance cases), 100% domain coverage, 94.82% overall lines; 52 production desktop/mobile browser tests; 15 axe page/theme states with zero detected violations |
| Build, lint and strict types       | Passed; production Worker deployed as version 15 from `a5e87e572958c8df4a7c0bb541335d425b875079`                                                                                                 |
| Live integrations                  | Actual OpenAI chat verified through the shipped client; prior plan and browser-air evidence retains its release timestamp                                                                        |
| GitHub CI                          | Workflow activated, but GitHub blocks all job steps because of the account billing lock                                                                                                          |
| Hack2skill draft                   | Existing links retained; owner has submitted once. This improvement pass does not use a remaining attempt                                                                                        |
| LinkedIn                           | [Owner-provided post link](https://lnkd.in/p/gRcxW3pH) entered into the required field; verified to open a CarbonWise post, so replacement with a HAWA post is required                          |

The refreshed demo replaced the existing Drive file version without changing its public link. The sharing dialog confirms **Anyone with the link — Viewer**. It records labelled manual data and loaded-page offline rules mode; the separate real AI check is not portrayed as part of that recording.

GitHub metadata rechecked on 21 November 2026 confirms a public repository and a reported size of **1,286 KiB**, below the 10 MB submission limit. See [repository evidence](../reports/repository.json).

See [the quality report](QUALITY_REPORT.md) for dated measurements, an earlier intermittent browser-test failure, subsequent passing runs, accessibility review limits and the platform-managed Lighthouse finding. Documentation/evidence commits after the deployed source revision do not change the application bundle.

The owner controls resubmission; this improvement pass has not clicked Submit. Resolving the GitHub billing lock is an account-owner action; local passing checks are not described as a successful hosted CI run.
