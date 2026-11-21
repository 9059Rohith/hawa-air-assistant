# ADR 0007: Location requests must not overwrite newer choices

Status: accepted, 21 November 2026.

## Context

City lookup, browser geolocation and air-model requests finish asynchronously. A successful response can arrive after the user clears data, enters a manual reading, changes the query or leaves the page. The browser geolocation API cannot cancel an outstanding callback. A stalled provider must not prevent manual recovery.

## Decision

The provider aborts its current reset signal synchronously when clearing data. The location form owns a request generation and a search controller. Every completion checks ownership before publishing state; clearing, stopping, replacing work and unmounting invalidate that ownership. A new reset signal also clears the form's query, readings and suggestions. Geolocation callbacks follow the same ownership rule.

City search has an eight-second deadline covering both response headers and the streamed body. City and air JSON bodies share the existing 256 KiB stream limit and strict UTF-8 decoding. Location results are schema-validated and limited to ten items. Failed HTTP bodies are cancelled rather than consumed as diagnostic text. Air cache age is checked again after a failed refresh, so an entry that expired while waiting cannot be returned.

The manual-reading control remains usable during remote work. An explicit Stop request control and Escape dismiss pending city work; late responses cannot restore the dismissed suggestions. Shared air requests may finish to populate their bounded in-memory cache, but obsolete consumers cannot publish their results. No persistent location history is added.

## Evidence and consequences

`tests/location-lifecycle.test.tsx` exercises Clear, Stop, manual recovery, Escape, unmount and delayed geolocation callbacks. `tests/location-client.test.ts` covers encoding, result limits, invalid coordinates, response limits, HTTP cleanup, deadlines and cancellation before a lazy client loads. Browser-air tests cover expiry during refresh and stalled/oversized bodies. Desktop/mobile journeys exercise manual recovery during stalled search and clearing/restarting lookup.

The client parser remains lazily loaded. No runtime dependency or paid model request is added. These tests establish software behavior under controlled failures; they do not guarantee provider availability, medical accuracy or a competition score.
