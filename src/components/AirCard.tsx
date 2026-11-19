"use client";
import { lazy, Suspense } from "react";
import { useHawa } from "./Provider";
const AirReading = lazy(() => import("./AirReading"));
/** Keep the first visit small; load the detailed gauge only after a reading exists. */
export function AirCard() {
  const { air, t, profile } = useHawa();
  const placeholder = (
    <section className="panel air-panel" aria-labelledby="air-title">
      <h2 id="air-title">{t.air}</h2>
      <div className="air-flex">
        <div className="gauge" role="img" aria-label={t.choose}>
          <span aria-hidden="true">○</span>
          <strong>—</strong>
          <span>{t.choose}</span>
        </div>
        <div className="scale">
          <p>
            {profile.lang === "hi"
              ? "US PM2.5 उप-सूचकांक"
              : "US PM2.5 sub-index"}
          </p>
          <strong>PM2.5</strong>
          <p>
            {profile.lang === "hi" ? "स्थान नहीं चुना" : "Location not set"}
          </p>
        </div>
      </div>
      <p className="fine attribution">
        <a href="https://open-meteo.com/en/docs/air-quality-api">
          Open-Meteo · CAMS/ECMWF · CC BY 4.0
        </a>
        <br />
        Modelled estimates can differ from monitors. This indicative PM2.5 index
        is not official multi-pollutant AQI or EPA NowCast.
      </p>
    </section>
  );
  return air ? (
    <Suspense fallback={<div aria-busy="true">{placeholder}</div>}>
      <AirReading />
    </Suspense>
  ) : (
    placeholder
  );
}
