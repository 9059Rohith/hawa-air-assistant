# 12. Bind plans and their outputs to the inputs used

Date: 27 November 2026

## Problem

Editing household choices after generating a plan left the older plan looking current. A validly shaped API response could also belong to another household or location. Printing included actions excluded from the what-if calculation, and copied summaries lost their data provenance and scenario limits.

## Decision

Compare the household, named coordinates and complete air snapshot before treating a plan as current. Language and simple-reading preferences do not change calculations. Changed inputs show a bilingual warning and require the existing validated wizard to rebuild before export or follow-up. Community projections use only a current plan.

Validate returned household/location values against the request. Manual readings and browser-supplied snapshots retain their provenance; server Open-Meteo requests may return a refreshed snapshot, which becomes the current snapshot together with the plan. Invalid responses use the existing honest local fallback.

Keep the selected action set consistent across scenario calculations, JSON, print and copied text. Empty selections disable output. Printed plans omit excluded actions. English and Hindi summaries retain source, observation time, units, selected steps and modelling limits. Blocked clipboard access opens selectable text. Private shared links continue to contain only curated action IDs and language.

## Verification and limits

Contract/component tests cover input changes, equivalent object key order, refreshed snapshots, response substitution, rebuilding, language changes, clipboard denial and selection consistency. Desktop/mobile browser regressions verify the user journeys and actual print styles. No clinical accuracy, new official competition score or first-load offline support is implied. The existing application, repository, audience and live URL are preserved.
