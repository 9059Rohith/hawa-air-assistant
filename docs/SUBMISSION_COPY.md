# HAWA submission fields

Use the existing Challenge 6 entry. This release does not create another application or consume an assessment attempt.

## Project name

HAWA — Urban Air Quality Assistant

## Description

HAWA helps families and communities navigate urban smog with practical daily plans in English and Hindi. It combines sourced Open-Meteo air data or clearly labelled manual readings with household, home, cooking and commute preferences. Server-side AI personalizes explanations and grounded follow-up answers; tested rules calculate impact scenarios and keep planning usable during service failures. Users can compare selected actions, inspect assumptions, print or export a consistent plan, and share curated steps without household data. Indoor-air tools and a seven-day community kit support local action. General guidance, not medical advice or a measurement of personal exposure.

## Links

- Application: https://hawa-air-assistant.vabjashwanthreddy.chatgpt.site
- Source: https://github.com/9059Rohith/hawa-air-assistant
- Captioned demonstration: https://drive.google.com/file/d/1rtsSNE5ervJveCU9nqPGF8UceikRsiU0/view
- Methodology: https://hawa-air-assistant.vabjashwanthreddy.chatgpt.site/about
- Event sign-in: https://vision.hack2skill.com/event/pwvirtual1/registration

## Challenge 6 form

Use the [existing submission page](https://hack2skill.com/event/pwvirtual1/dashboard/submissions/6afaaed39be15aea670e2bed). The form includes a required LinkedIn field. Its existing value is managed by the entrant. The dashboard showed 2 of 3 attempts used and 97/100 on 28 November 2026.

## Changes in the deployed version

HAWA keeps each plan tied to its air reading. Rebuilding preserves the original observation time, source, timezone and any illustrative forecast. Manual measurements cannot acquire a forecast, and the API rejects conflicting sources. Older clients can still send a single PM2.5 value. Browser and server now use the same freshness limits. The profile wizard separates navigation from typed form controls, shares accessible error handling, and preserves children's ages while their household count is being edited. City search and location lookup use a shared check so late replies cannot replace newer choices. Verification: 668 passing automated cases, including 87 acceptance scenarios; 100% domain coverage and 95.91% application line coverage. The dependency check found zero violations across 83 source modules.

## Generative AI services used

HAWA uses OpenAI on the server for two tasks: explaining selected household actions and answering follow-up questions in English or Hindi. The model receives bounded context from the household profile, air reading, selected actions and curated guidance. It can explain an action, while deterministic TypeScript calculates the air index, exposure scenarios and travel CO2 estimates. The server validates model output against the selected action IDs before displaying it. When the provider is unavailable or output fails validation, HAWA gives a labelled rules-based response. Urgent phrases use a predefined response. Open-Meteo supplies modelled air data. Manual readings and household examples retain their own source labels.
