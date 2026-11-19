# Security and privacy

Report issues privately through the repository owner's GitHub profile; never include credentials or personal health data in a public issue.

| Threat                                 | Mitigation                                                                                                                     | Residual limit                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Prompt injection / invented quantities | Fixed candidate set, system/data separation, strict JSON, ID equality, numeric/link rejection, fallback                        | Text guard is not a formal guarantee of semantic truth; curated guidance remains visible           |
| Credential leakage                     | Server-only env access, ignored env files, source scan, no raw provider errors                                                 | Rotate credentials exposed outside the repository                                                  |
| SSRF                                   | Fixed HTTPS host allowlist, reject credentials/custom ports, redirects disabled                                                | Trusted providers still process their stated input                                                 |
| Excessive spend                        | 8 KB requests, 12/min process-local rate bucket, three-call concurrency cap, 1,400 output-token cap, bounded retry and timeout | Serverless instances do not share rate state; add Redis and platform spend limits for broad launch |
| XSS                                    | Escaped React text, no generated HTML, nonce script CSP, no third-party browser scripts                                        | Inline styles allowed for framework compatibility                                                  |
| Cross-site requests                    | Same-origin check for browser POST requests, no permissive CORS, strict bodies                                                 | No accounts or server-side user storage are present                                                |
| Misleading health guidance             | Urgent phrase triage before AI, no diagnosis/dosage, CO warnings, scenario labels                                              | Triage is conservative and not exhaustive; some negated phrases can trigger                        |
| Privacy leakage                        | Approximate coordinates, no analytics/logged prompts, optional local profile, clear-data control                               | Saved risk flags are visible to users of the same browser; cloud providers process requests        |

No security certification is claimed. `.env.local` must never be tracked. `npm run scan-secrets` detects common credential formats but is not an exhaustive secret detector. The dependency audit is a point-in-time result.
