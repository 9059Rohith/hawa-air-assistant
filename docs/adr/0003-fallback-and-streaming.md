# ADR 3: validate before streaming

Accepted. Rules mode is a first-class option, including for demonstrations and tests. Chat sends SSE chunks only after a short structured model response is validated. Raw-token streaming would improve first-token latency but would expose unsafe text before the guard could act. This version chooses validation over raw streaming.

Recognised urgent phrases are handled on the client before any network request, with the same triage repeated server-side for direct API clients. Stop and unmount cancel the reader, and an ownership check prevents late responses or cancelled partial answers from entering a newer conversation. Routine AI responses still wait for validation; measured first-response time is reported separately from page loading.
