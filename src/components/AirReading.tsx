"use client";
import { aqi, cpcb, bestWindow } from "@/domain/aqi";
import type { Air } from "@/domain/types";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useHawa } from "./Provider";
const Forecast = dynamic(() => import("./Forecast").then((m) => m.Forecast));

function AirGauge({
  air,
  location,
  hi,
}: {
  air: Air;
  location: string;
  hi: boolean;
}) {
  const band = aqi(air.pm25);
  const label = hi ? band.hiLabel : band.label;
  return (
    <div className="air-flex">
      <div
        className="gauge"
        data-level={band.level}
        role="img"
        aria-label={`${band.value}, ${label}, PM2.5`}
      >
        <span aria-hidden="true">
          {["○", "◇", "△", "!", "!!", "⚠"][band.level]}
        </span>
        <strong>{band.value}</strong>
        <span>{label}</span>
      </div>
      <div className="scale">
        <p>{hi ? "US PM2.5 उप-सूचकांक" : "US PM2.5 sub-index"}</p>
        <strong>{air.pm25.toFixed(1)} µg/m³</strong>
        <p>{location}</p>
        <p>
          {hi ? "भारत PM2.5 श्रेणी" : "India PM2.5 band"}: {cpcb(air.pm25)}
        </p>
      </div>
    </div>
  );
}
function sourceLabel(air: Air, hi: boolean) {
  if (air.source === "manual")
    return hi
      ? "आपकी दर्ज रीडिंग · पूर्वानुमान नहीं"
      : "Your manual reading · no forecast";
  if (air.source === "demo")
    return hi ? "उदाहरण डेटा" : "Illustrative demo data";
  return `${hi ? "मॉडल का समय" : "Model timestamp"}: ${air.observedAt} (${air.timezone})`;
}
function AirProvenance({
  air,
  hi,
  now,
}: {
  air: Air;
  hi: boolean;
  now: number | null;
}) {
  return (
    <>
      {now !== null && (
        <p className="fine">
          {hi ? "प्राप्त किए" : "Retrieved"}{" "}
          {Math.max(0, Math.floor((now - Date.parse(air.fetchedAt)) / 60000))}{" "}
          {hi
            ? "मिनट पहले; स्रोत का समय नीचे है।"
            : "min ago; source timestamp below."}
        </p>
      )}
      <p className="fine">{sourceLabel(air, hi)}</p>
      {air.source === "open-meteo-browser" && (
        <p className="fine">
          Open-Meteo model data fetched by your browser; not independently
          verified by HAWA&apos;s server.
        </p>
      )}
      {air.stale && (
        <p className="notice">
          {hi
            ? "कैश डेटा: लाइव अपडेट विफल। स्थानीय मॉनिटर जाँचें।"
            : "Cached data: live refresh failed. Check a local monitor."}
        </p>
      )}
    </>
  );
}
function AirGuidance({ air, hi }: { air: Air; hi: boolean }) {
  const window = bestWindow(air.hourly);
  return (
    <>
      {aqi(air.pm25).level >= 4 && (
        <p className="warning" role="alert">
          {hi
            ? "गंभीर प्रदूषण: बाहर कठिन गतिविधि कम करें। साफ कमरे में रहें और संवेदनशील लोगों का ध्यान रखें।"
            : "Severe pollution: reduce strenuous outdoor activity. Prioritize a cleaner indoor space and higher-risk family members."}
        </p>
      )}
      {window && (
        <p>
          {hi ? "कम प्रदूषण का अनुमानित समय" : "Lower forecast window"}:{" "}
          {window.time.slice(11, 16)} · {window.mean.toFixed(1)} µg/m³.{" "}
          {hi ? "कम का अर्थ सुरक्षित नहीं।" : "Lower does not mean safe."}
        </p>
      )}
    </>
  );
}
export default function AirReading() {
  const { air, location, t, profile } = useHawa();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  if (!air) return null;
  const hi = profile.lang === "hi";
  return (
    <section className="panel air-panel" aria-labelledby="air-title">
      <h2 id="air-title">{t.air}</h2>
      <AirGauge
        air={air}
        location={
          location?.name ?? (hi ? "स्थान नहीं चुना" : "Location not set")
        }
        hi={hi}
      />
      <AirProvenance air={air} hi={hi} now={now} />
      <AirGuidance air={air} hi={hi} />
      <Forecast air={air} hi={hi} />
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
