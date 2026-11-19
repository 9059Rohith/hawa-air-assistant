"use client";
import { aqi, cpcb, bestWindow } from "@/domain/aqi";
import { useHawa } from "./Provider";
export function AirCard() {
  const { air, location, t, profile } = useHawa();
  const band = air ? aqi(air.pm25) : null;
  const window = air ? bestWindow(air.hourly) : null;
  return (
    <section className="panel air-panel" aria-labelledby="air-title">
      <h2 id="air-title">{t.air}</h2>
      <div className="air-flex">
        <div className="gauge">
          <strong>{band?.value ?? "—"}</strong>
          <span>
            {band
              ? profile.lang === "hi"
                ? band.hiLabel
                : band.label
              : t.choose}
          </span>
        </div>
        <div className="scale">
          <p>US PM2.5 sub-index</p>
          <strong>{air ? `${air.pm25.toFixed(1)} µg/m³` : "PM2.5"}</strong>
          <p>{location?.name ?? "Location not set"}</p>
          {air && <p>India PM2.5 band: {cpcb(air.pm25)}</p>}
        </div>
      </div>
      {air && (
        <>
          <p className="fine">
            {air.source === "manual"
              ? "Your manual reading · no forecast"
              : air.source === "demo"
                ? "Illustrative demo data"
                : `Model timestamp: ${air.observedAt} (${air.timezone})`}
          </p>
          {air.stale && (
            <p className="notice">
              Cached data: live refresh failed. Check a local monitor.
            </p>
          )}
          {band && band.level >= 4 && (
            <p className="warning" role="alert">
              {profile.lang === "hi"
                ? "गंभीर प्रदूषण: बाहर कठिन गतिविधि कम करें। साफ कमरे में रहें और संवेदनशील लोगों का ध्यान रखें।"
                : "Severe pollution: reduce strenuous outdoor activity. Prioritize a cleaner indoor space and higher-risk family members."}
            </p>
          )}
          {window && (
            <p>
              Lower forecast window: {window.time.slice(11, 16)} · about{" "}
              {window.mean.toFixed(1)} µg/m³. Lower does not mean safe.
            </p>
          )}
          {air.hourly.length > 0 && (
            <details>
              <summary>Hourly forecast · table</summary>
              <div className="table-scroll">
                <table>
                  <caption>Modelled PM2.5, µg/m³ · {air.timezone}</caption>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>PM2.5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {air.hourly.map((h) => (
                      <tr key={h.time}>
                        <td>{h.time.replace("T", " ")}</td>
                        <td>{h.pm25.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
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
}
