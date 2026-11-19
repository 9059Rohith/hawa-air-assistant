"use client";
import { aqi, cpcb, bestWindow } from "@/domain/aqi";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
const Forecast = dynamic(() => import("./Forecast").then((m) => m.Forecast));
import { useHawa } from "./Provider";
export default function AirReading() {
  const { air, location, t, profile } = useHawa();
  const band = air ? aqi(air.pm25) : null;
  const window = air ? bestWindow(air.hourly) : null;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <section className="panel air-panel" aria-labelledby="air-title">
      <h2 id="air-title">{t.air}</h2>
      <div className="air-flex">
        <div
          className="gauge"
          data-level={band?.level}
          role="img"
          aria-label={
            band
              ? `${band.value}, ${profile.lang === "hi" ? band.hiLabel : band.label}, PM2.5`
              : t.choose
          }
        >
          <span aria-hidden="true">
            {["○", "◇", "△", "!", "!!", "⚠"][band?.level ?? 0]}
          </span>
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
          <p>
            {profile.lang === "hi"
              ? "US PM2.5 उप-सूचकांक"
              : "US PM2.5 sub-index"}
          </p>
          <strong>{air ? `${air.pm25.toFixed(1)} µg/m³` : "PM2.5"}</strong>
          <p>
            {location?.name ??
              (profile.lang === "hi" ? "स्थान नहीं चुना" : "Location not set")}
          </p>
          {air && (
            <p>
              {profile.lang === "hi" ? "भारत PM2.5 श्रेणी" : "India PM2.5 band"}
              : {cpcb(air.pm25)}
            </p>
          )}
        </div>
      </div>
      {air && (
        <>
          {now !== null && (
            <p className="fine">
              {profile.lang === "hi" ? "प्राप्त किए" : "Retrieved"}{" "}
              {Math.max(
                0,
                Math.floor((now - Date.parse(air.fetchedAt)) / 60000),
              )}{" "}
              {profile.lang === "hi"
                ? "मिनट पहले; स्रोत का समय नीचे है।"
                : "min ago; source timestamp below."}
            </p>
          )}
          <p className="fine">
            {air.source === "manual"
              ? profile.lang === "hi"
                ? "आपकी दर्ज रीडिंग · पूर्वानुमान नहीं"
                : "Your manual reading · no forecast"
              : air.source === "demo"
                ? profile.lang === "hi"
                  ? "उदाहरण डेटा"
                  : "Illustrative demo data"
                : `${profile.lang === "hi" ? "मॉडल का समय" : "Model timestamp"}: ${air.observedAt} (${air.timezone})`}
          </p>
          {air.source === "open-meteo-browser" && (
            <p className="fine">
              Open-Meteo model data fetched by your browser; not independently
              verified by HAWA&apos;s server.
            </p>
          )}
          {air.stale && (
            <p className="notice">
              {profile.lang === "hi"
                ? "कैश डेटा: लाइव अपडेट विफल। स्थानीय मॉनिटर जाँचें।"
                : "Cached data: live refresh failed. Check a local monitor."}
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
              {profile.lang === "hi"
                ? "कम प्रदूषण का अनुमानित समय"
                : "Lower forecast window"}
              : {window.time.slice(11, 16)} · {window.mean.toFixed(1)} µg/m³.{" "}
              {profile.lang === "hi"
                ? "कम का अर्थ सुरक्षित नहीं।"
                : "Lower does not mean safe."}
            </p>
          )}
          <Forecast air={air} hi={profile.lang === "hi"} />
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
