# ADR 5: evidence boundaries take precedence over literal older examples

Accepted, 19 November 2026.

- Use EPA 2024 PM2.5 breakpoints rather than obsolete example breakpoints in the build brief. Hourly conversion is indicative, not official AQI/NowCast.
- Label the implemented travel calculation operational CO₂ rather than CO₂e: source factors do not establish a full greenhouse-gas lifecycle boundary. Use dated India-oriented sources, unit-safe occupancy handling and explicit uncertainty; do not invent current calibration.
- Use user-entered input energy for fuel carbon. Cooking/heating duration alone does not establish appliance power or fuel quantity. Keep PM source categories qualitative and exclude unsupported waste-savings numbers.
- Preserve the existing Next 15 / React 19 stack. Deploy through OpenNext on Sites / Cloudflare Workers because the owner's Vercel/Railway accounts are restricted.
- Keep profiles opt-in and local, share only curated IDs/language, and do not add remote household storage just to satisfy a checklist.
- Local rules planning and chat work after the relevant route is loaded. No service-worker first-visit/offline-reopening claim is made.
- CI is configured but billing-blocked before steps execute. Local results are evidence; they are not relabelled as a successful hosted run.

These choices preserve the problem statement while making scientific, privacy and verification limits inspectable.
