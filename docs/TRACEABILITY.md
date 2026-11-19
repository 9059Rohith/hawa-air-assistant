# Problem-to-evidence traceability

| Clause                   | Feature                                                           | Code                                              | Verification                                                 |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| GenAI assistant          | Validated OpenAI explanations and cited chat                      | `services/llm.ts`, `app/api/chat`                 | Live AI report + provider/fallback contracts                 |
| Families                 | Profiles, risk flags and three presets                            | `ProfileWizard.tsx`, `data/personas.ts`           | Component wizard and selection tests                         |
| Communities              | Seven-day notice/checklist and scenario calculator                | `Community.tsx`                                   | Component + desktop/mobile browser tests                     |
| Severe winter smog       | Timestamped model data, updated indices, urgent banner            | `services/air.ts`, `domain/aqi.ts`, `AirCard.tsx` | Boundaries, stale upstream, alert tests                      |
| Low-emission routines    | Feasible commute and safe routine alternatives                    | `domain/select.ts`, `data/knowledge.ts`           | Persona selection and transport invariants                   |
| Indoor hacks             | Source control, filtration, purifier sizing, myths                | `Learn.tsx`, `domain/impact.ts`                   | Sizing examples and library validation                       |
| Sustainable alternatives | Transit, carpool, clean fuel, no waste burning                    | `data/knowledge.ts`                               | All sixty entries schema-checked                             |
| Location and lifestyle   | Search, approximate geolocation, manual values, budget            | `LocationForm.tsx`, `ProfileWizard.tsx`           | Search, failure and complete journey tests                   |
| Direct impact            | Combined scenario, expandable assumptions, weekly/community table | `PlanView.tsx`, `domain/impact.ts`                | Worked example, no-double-counting and property-style checks |

Demo narrative follows this order. The recorded demonstration uses a local production build and labels demo/manual readings; it must not be represented as a live production recording.
