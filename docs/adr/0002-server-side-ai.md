# ADR 2: fixed server-side provider boundary

Accepted. AI credentials remain in server environment variables. Browser requests use same-origin APIs. HTTPS allowlists and redirect rejection prevent configurable-endpoint SSRF. We do not expose a user-controlled model URL. Provider failures return rules guidance, not raw errors.
