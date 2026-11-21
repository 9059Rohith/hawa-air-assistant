# ADR 0008: Chat transport and generation-mode ownership

Status: accepted, 21 November 2026.

## Context

The chat hook handled HTTP construction, stream parsing, cancellation, history and UI updates in one place. HTTP errors could leave response bodies unconsumed. Switching the visible rules-mode control did not invalidate pending online plan or chat work, so a late AI response could replace the user's newer local result.

## Decision

`src/lib/chat-client.ts` owns the HTTP contract: bounded conversation history, plan context, current language preferences, exact event-stream media type, error-body cancellation and a single thirty-second deadline spanning headers and body. The hook owns reply visibility, conversation history and cancellation identity. Existing stream byte/event/text bounds remain in the decoder.

The stream must declare one response mode before emitting text. Missing or repeated mode declarations are protocol failures, including attempts to relabel partial model text as rules guidance. Invalid responses fall back to cited local guidance; they are never added to history as successful remote answers.

Rules-mode changes are dependencies of both generation lifecycles. Changing mode aborts pending work and releases the busy UI immediately. Chat also resets its reply and short-lived history at the boundary, preventing rules-only conversation from being included when returning online. The current question remains editable for an explicit retry. Cancellation cannot undo work an external provider has already performed.

## Evidence

Client contract tests cover bounded history, language/context preservation, media-type rejection, failed-body cleanup, missing bodies, cancellation before fetch, late fetch responses and stalled headers/body. Lifecycle tests resolve and reject obsolete requests after a mode change, cancel partial readers and check history isolation. Desktop/mobile journeys exercise plan and chat mode changes while requests are pending and recover from contradictory stream provenance.

No runtime dependency, additional model request or weaker test/performance gate is introduced. These checks verify software behavior under controlled responses; they do not establish a competition score or eliminate all provider failures.
