# ADR 3: validate before streaming

Accepted. Rules mode is a first-class option, including for demonstrations and tests. Chat sends SSE chunks only after a short structured model response is validated. Raw-token streaming would improve first-token latency but would expose unsafe text before the guard could act. This version chooses validation over raw streaming.
