# Methodology and limits

## AQI

`src/domain/aqi.ts` uses US EPA PM2.5 breakpoints updated in 2024: 0–9.0, 9.1–35.4, 35.5–55.4, 55.5–125.4, 125.5–225.4 and 225.5–325.4 µg/m³. Truncate concentration to one decimal place, interpolate within the band, then round the index. Above the top breakpoint, extrapolate the final slope. Negative/non-finite values fail validation.

EPA's scale is for 24-hour concentration. Applying it to an hourly model or manual reading is **indicative**, not EPA NowCast. India’s separate label maps PM2.5 concentration to CPCB bands: ≤30, ≤60, ≤90, ≤120, ≤250, >250. It is not the official multi-pollutant CPCB index.

Sources: [EPA current table](https://aqs.epa.gov/aqsweb/documents/codetables/aqi_breakpoints.html), [CPCB](https://airquality.cpcb.gov.in/AQI_India/).

## Ambient-only exposure scenario

Room volume = floor area × user-entered ceiling height (default 2.7 m).

Indoor concentration = outdoor concentration × infiltration × 0.5 / (0.5 + CADR / room volume).

Daily exposure = outdoor concentration × outdoor hours × respirator penetration × activity multiplier + indoor concentration × remaining hours.

Infiltration 0.3/0.5/0.7, the nominal 0.5/h term and adult respirator penetration 0.2 are **scenario assumptions**, not individually validated building or mask measurements. The activity multiplier is 1/1.5/3 for rest/walking/running; mask penetration is 1/0.9/0.7/0.2 for none/cloth/surgical/N95. These rough adult scenario values are not validated dose or fit estimates. Indoor sources, gases, changing weather and individual physiology are excluded. Filtration cannot control CO. Reducing outdoor exercise substitutes one outdoor hour with one indoor hour. Adding a filter assumes four air changes per hour unless an existing entered CADR is higher. Never interpret these percentages as disease-risk reductions.

Purifier sizing uses volume × 4–5/h as an illustrative design target; check device smoke CADR, actual speed and noise. [EPA filtration guidance](https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home) supports source control plus appropriate ventilation and filtration, but does not validate HAWA's particular scenario constants.

## Worked Meera example

Use manual PM2.5 = 120, outdoor time = 2 h, typical infiltration = 0.5, no purifier, 20 m² room, 2.7 m ceiling. Indoor concentration = 60. Baseline = 120 × 2 + 60 × 22 = **1,560 µg/m³·h**.

For an adult scenario with one outdoor hour replaced by indoor time and a fitted-respirator assumption on the remaining hour: 120 × 1 × 0.2 + 60 × 23 = **1,404 µg/m³·h**, a **10%** reduction. This does not estimate a child's exposure. Adding a four-ACH filter changes indoor concentration to 120 × 0.5 × 0.5 / 4.5 = 6.667, giving a combined exposure of about **177.33**. Do not add the standalone percentages. Free/low-budget selection does not automatically select a new purifier purchase.

The cigarette-equivalent communication aid uses concentration-time change without the activity multiplier, divided by 24 and then by 22. [Berkeley Earth](https://berkeleyearth.org/air-pollution-and-cigarette-equivalence/) describes this population-level rule of thumb; it is not clinical equivalence or smoking history.

## Travel and community comparisons

Source-controlled factors are in [emission-factors.json](../src/data/emission-factors.json), including units, source year and uncertainty. Travel estimates **operational CO₂**, not lifecycle CO₂e. India GHG Programme (2015) references: petrol hatchback 0.140, diesel hatchback 0.126, CNG 0.108 and motorcycle 0.040 kg/vehicle-km. CNG and e-rickshaw/EV entries expose their conversion assumptions. Intracity bus 0.015 kg/passenger-km is not divided by occupancy again. Metro 0.035 is explicitly an uncalibrated scenario assumption. Walking/cycling have zero propulsion emissions within this boundary, excluding food and infrastructure. EV/grid factors use the cited historical CEA grid boundary, not a claim of current national performance.

For 12 km/day, a one-person petrol-car scenario is 1.68 kg/day; two-person carpool is 0.84 kg/day per person. Difference = 0.84 kg/day, or 5.88 kg/week if all seven days repeat. The lowest feasible commute factor wins; transit and carpool savings never sum. Work-from-home scales remaining travel by (7 − days)/7.

Community = per-commuter daily saving × seven × households × participation / 100. Assumes one identical commuter per participating household; it never multiplies health effects.

The separate Learn calculator accepts **fuel input energy in kWh**: combustion CO₂ = kWh × 0.0036 GJ/kWh × IPCC kg CO₂/GJ. Electricity uses the dated CEA kg CO₂/kWh factor. Equal input energy is not equal useful heat; appliance efficiency is not assumed. Wood reports gross biogenic CO₂, not fossil or net climate impact. Cooking/heating hours alone cannot establish fuel consumption. Particle-source categories are qualitative, never additive savings or health-risk ratios. Waste benefits remain qualitative.

## Validation

Tests cover all breakpoints, invalid values, current-factor application, duplicate actions, transport applicability, cleaner-filter monotonicity and non-negative results. This is software verification, not empirical validation of the exposure model. Confidence is low throughout the numeric interface.
