# Accessibility

Target: WCAG 2.2 AA, not certified conformance.

Implemented: landmarks, skip link, visible labels, native form controls, minimum 44px interactive targets, visible keyboard focus, text labels alongside severity, status updates, urgent alerts, readable tables, reduced-motion and forced-colors styles, print styling, language attribute changes, Hindi guidance and feature-detected read-aloud.

| Check                                         | Result                                                     |
| --------------------------------------------- | ---------------------------------------------------------- |
| axe on five routes × light/dark/high-contrast | 15 states, zero detected violations in the recorded run    |
| Text contrast script                          | All tested text/surface pairs exceed 4.5:1                 |
| Desktop/mobile route reflow                   | Passed Playwright smoke checks                             |
| Household, what-if and chat interactions      | Automated component and browser checks pass                |
| NVDA / VoiceOver                              | Not independently performed; no manual screen-reader claim |
| Full professional Hindi review                | Pending; some secondary interface copy remains English     |

Automated tests cannot establish complete accessibility. The video and docs should not present an unqualified AA certification badge.
