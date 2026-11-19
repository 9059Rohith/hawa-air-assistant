import Link from "next/link";
export const metadata = { title: "Methodology and privacy" };
export default function Page() {
  return (
    <>
      <section className="hero compact">
        <h1>Clear advice. Open assumptions.</h1>
        <p>
          HAWA helps you compare practical choices. It does not diagnose,
          measure personal exposure or promise health outcomes.
        </p>
      </section>
      <section className="prose">
        <h2>Numbers come from code, not the AI</h2>
        <p>
          OpenAI writes short explanations using a fixed set of curated actions.
          A validated, deterministic engine owns every impact number. Invalid AI
          output falls back to the same useful rules-based plan.
        </p>
        <h2>What the exposure model assumes</h2>
        <p>
          We hold outdoor PM2.5 constant for one illustrative day. Indoor
          infiltration is 0.3, 0.5 or 0.7 for sealed, typical or leaky windows.
          Indoor concentration uses a steady-state model with a nominal 0.5/h
          removal term and the entered CADR divided by room volume. Real
          buildings, fan speeds and filter condition vary greatly.
        </p>
        <p>
          Reducing outdoor exercise replaces one outdoor hour with one indoor
          hour. The adult respirator scenario assumes 0.2 penetration, not
          guaranteed protection. Totals recompute the full scenario; they never
          add overlapping exposure percentages.
        </p>
        <h2>Emissions and uncertainty</h2>
        <p>
          Transport scenarios use rounded assumptions in kg CO₂e/km: car 0.17,
          bus 0.10, metro 0.035, EV 0.09, motorcycle 0.10. Walking and cycling
          have zero operational emissions in this simplified boundary. These are
          illustrative comparisons informed by published conversion-factor
          methods, not India-specific measured factors or lifecycle inventories.
          Car occupancy and work-from-home days change the result. Cooking,
          heating and waste advice remains qualitative because reliable
          household-specific factors are missing.
        </p>
        <h2>Why cigarette equivalents are optional context</h2>
        <p>
          The Berkeley Earth rule of thumb divides daily mean PM2.5 by 22. It is
          a population-level communication aid, not a clinical equivalence or a
          claim that an individual smoked cigarettes. Inhalation-rate
          differences and indoor sources are excluded.
        </p>
        <h2>Your privacy</h2>
        <p>
          No accounts, analytics or advertising. Household preferences remain in
          memory unless you explicitly save them on this device. Saved
          preferences can contain health-risk flags; clear them on shared
          devices. To generate a plan, inputs go to our server. AI receives only
          a compact household summary and curated guidance, not coordinates. Air
          providers receive coordinates rounded to two decimals. Serverless
          memory caches expire and are not shared storage.
        </p>
        <h2>Data and safety</h2>
        <p>
          Open-Meteo and CAMS/ECMWF provide modelled air estimates, attributed
          under CC BY 4.0. They can differ from local ground monitors. The EPA
          PM2.5 scale uses the 2024 breakpoints. India’s displayed band is a
          PM2.5 concentration category, not a conversion from US AQI or official
          overall CPCB AQI.
        </p>
        <p>
          Urgent symptoms need urgent medical care. Never use indoor charcoal or
          a generator in an enclosed space. Particle filters do not remove
          carbon monoxide. Do not change medication based on HAWA.
        </p>
        <Link href="/learn#sources">Read the original sources →</Link>
      </section>
    </>
  );
}
