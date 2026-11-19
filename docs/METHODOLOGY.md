# Methodology and limits

## AQI

`src/domain/aqi.ts` uses US EPA PM2.5 breakpoints updated in 2024: 0–9.0, 9.1–35.4, 35.5–55.4, 55.5–125.4, 125.5–225.4 and 225.5–325.4 µg/m³. Truncate concentration to one decimal place, interpolate within the band, then round the index. Above the top breakpoint, extrapolate the final slope. Negative/non-finite values fail validation.

EPA's scale is for 24-hour concentration. Applying it to an hourly model or manual reading is **indicative**, not EPA NowCast. India’s separate label maps PM2.5 concentration to CPCB bands: ≤30, ≤60, ≤90, ≤120, ≤250, >250. It is not the official multi-pollutant CPCB index.

Sources: [EPA current table](https://aqs.epa.gov/aqsweb/documents/codetables/aqi_breakpoints.html), [CPCB](https://airquality.cpcb.gov.in/AQI_India/).

## Ambient-only exposure scenario

Room volume = floor area × 2.7 m ceiling height.

Indoor concentration = outdoor concentration × infiltration × 0.5 / (0.5 + CADR / room volume).

Daily exposure = outdoor concentration × outdoor hours × respirator penetration + indoor concentration × remaining hours.

Infiltration 0.3/0.5/0.7, the nominal 0.5/h term and adult respirator penetration 0.2 are **scenario assumptions**, not individually validated building or mask measurements. Indoor sources, gases, changing weather and activity-dependent inhalation are excluded. Filtration cannot control CO. Reducing outdoor exercise substitutes one outdoor hour with one indoor hour. Adding a filter assumes four air changes per hour unless an existing entered CADR is higher. Never interpret these percentages as disease-risk reductions.

Purifier sizing uses volume × 4–5/h as an illustrative design target; check device smoke CADR, actual speed and noise. [EPA filtration guidance](https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home) supports source control plus appropriate ventilation and filtration, but does not validate HAWA's particular scenario constants.

## Worked Meera example

Use manual PM2.5 = 120, outdoor time = 2 h, typical infiltration = 0.5, no purifier, 20 m² room, 2.7 m ceiling. Indoor concentration = 60. Baseline = 120 × 2 + 60 × 22 = **1,560 µg/m³·h**.

For an adult scenario with one outdoor hour replaced by indoor time and a fitted-respirator assumption on the remaining hour: 120 × 1 × 0.2 + 60 × 23 = **1,404 µg/m³·h**, a **10%** reduction. This does not estimate a child's exposure. Adding a four-ACH filter changes indoor concentration to 120 × 0.5 × 0.5 / 4.5 = 6.667, giving a combined exposure of about **177.33**. Do not add the standalone percentages. Free/low-budget selection does not automatically select a new purifier purchase.

The cigarette-equivalent communication aid divides exposure change by 24 and then by 22. [Berkeley Earth](https://berkeleyearth.org/air-pollution-and-cigarette-equivalence/) describes this population-level rule of thumb; it is not clinical equivalence or smoking history.

## Travel and community comparisons

Rounded scenario factors in kg CO₂e per km: car 0.17, EV 0.09, bus 0.10, metro 0.035, motorcycle 0.10; walking/cycling zero operational emissions. These are labelled illustrative assumptions, informed by conversion-factor methodology rather than cited as exact Indian factors. [UK DESNZ methodology](https://assets.publishing.service.gov.uk/media/6846b0870392ed9b784c0187/2025-GHG-CF-methodology-paper.pdf) is methodological context. Occupancy divides car/EV factors. Bus and metro factors are already per passenger. Do not divide them again.

For 12 km/day, one-person car travel is 2.04 kg/day; two-person carpool is 1.02 kg/day per person. Difference = 1.02 kg/day, or 7.14 kg/week assuming all seven days repeat. The selected commute alternative with the lowest factor wins; transit and carpool savings never sum. Work-from-home days multiply remaining travel by (7 − days)/7.

Community scenario = per-commuter daily saving × 7 × households × participation percentage / 100. Assumes one identical commuter per participating household; it never multiplies health effects. Cooking, heating and waste benefits are qualitative because this version lacks sufficiently grounded household-specific emission factors.

## Validation

Tests cover all breakpoints, invalid values, current-factor application, duplicate actions, transport applicability, cleaner-filter monotonicity and non-negative results. This is software verification, not empirical validation of the exposure model. Confidence is low throughout the numeric interface.
