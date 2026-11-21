# ADR 0010: Strict shared kits and owned speech playback

Status: accepted

## Context

Shared kits promise that a link contains only curated action identifiers and a language. The old reader validated those properties but tolerated additional fields, so a manually constructed link could carry household data while displaying the privacy assurance. The producer could also create invalid empty or unknown selections. Speech playback had no completion/error lifecycle and could continue after its content changed or household data was cleared.

## Decision

Use one strict, bounded schema for the share producer and consumer. Accept only version 1, English/Hindi, and one to ten catalog IDs; reject extra fields and IDs outside the consumer's allowlist. Deduplicate valid selections without mutating inputs. Keep the existing disabled Share button for empty selections and catch producer failures in the same UI error boundary as native sharing.

Move speech ownership into a dedicated hook. Each playback owns its utterance callbacks. Completion/error returns controls to idle; pause/resume tracks the current state. Text/language changes, data clearing and unmount cancel owned speech and detach callbacks. Identity checks ignore previously queued callbacks. A cleared session cannot restart playback. Native browser errors produce a recoverable localized message, and controls never submit a surrounding form.

## Consequences and verification

The [Web Speech API specification](https://webaudio.github.io/web-speech-api/#speechsynthesis-methods) states that cancellation preserves the engine's paused state. Starting a replacement therefore resumes a paused engine before speaking, including after Pause → Stop → Read. Regression doubles model this native behavior.

Older well-formed links remain valid. Links with unsupported metadata are intentionally rejected. URL fragments are client-readable, so this contract is not encryption and users should still avoid putting private information in URLs. The application never copies household details into generated shared links.

Unit and component regressions cover strict fields, catalog/allowlist boundaries, selection bounds, deduplication, playback completion/error, stale callbacks, cancellation, native exceptions, language changes and form behavior. Desktop/mobile browser tests exercise sharing and speech controls. Speech APIs are simulated in tests; physical voice availability and audible output still depend on the user's browser and operating system. These checks do not establish an external competition score.
