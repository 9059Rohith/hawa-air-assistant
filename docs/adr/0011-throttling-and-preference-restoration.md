# ADR 0011: Ordered rate-limit expiry and preference restoration

Status: accepted

## Context

The process-local limiter scanned every active client on each request, even when no bucket could expire. When capacity was full, its Retry-After value did not reflect the earliest bucket expiry. A saved household profile also overwrote a more recent device language selection on reload, and a delayed corrupt restore could overwrite the notice produced by Clear.

## Decision

Renew bucket insertion order only after accepted requests. Because accepted timestamps are monotonic, expiry can remove the oldest buckets and stop at the first live one. Reject invalid configuration/timestamps and clamp clock rollback to the most recent observed time. Per-client rejection waits for the oldest accepted request to expire; capacity rejection waits for the earliest whole bucket to expire. Rejected requests never renew a bucket. Normal work depends on the selected client's bounded window and expired entries, rather than every active client.

Parse saved profiles in a lazily loaded module. Reject data exceeding 8,192 UTF-16 code units before JSON parsing, then validate the full household schema. A valid, separately stored language preference takes precedence over the saved profile language. Invalid preferences retain the validated profile language. Restore success and failure both respect editing, Clear and unmount ownership. Saving remains explicit; changing language does not silently rewrite household data.

## Verification and limits

Boundary tests cover renewal order, exact expiry, capacity retry, rejected traffic, rollback and invalid input. A deterministic 10,000-request comparison checks allow/reject and retry results against an independent full-scan reference model. Preference tests cover schema errors, size boundaries, language precedence and delayed errors after Clear. Desktop/mobile journeys verify language restoration and usable manual planning after oversized storage is rejected.

The rate limiter and its clock remain per Worker isolate, not a distributed account-wide quota. Expiring many buckets still requires visiting those expired buckets. These correctness and resource improvements do not imply an external judging score or universal latency guarantee.
