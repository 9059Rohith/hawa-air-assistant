"use client";
import { useState } from "react";
import type { Air } from "@/domain/types";
/** SVG view and a complete text alternative share the same source readings. */
export function Forecast({ air, hi }: { air: Air; hi: boolean }) {
  const [focused, setFocused] = useState<number | null>(null);
  if (!air.hourly.length) return null;
  const max = Math.max(1, ...air.hourly.map((h) => h.pm25));
  const x = (i: number) => 30 + (i * 540) / Math.max(1, air.hourly.length - 1);
  const y = (pm: number) => 145 - (pm / max) * 120;
  const active = focused === null ? null : air.hourly[focused];
  return (
    <section aria-label={hi ? "घंटेवार पूर्वानुमान" : "Hourly forecast"}>
      <h3>{hi ? "आगे की हवा" : "Air ahead"}</h3>
      <p className="fine">
        {hi
          ? "पूर्वानुमान, माप नहीं। बिंदु पर टैब करें या तालिका पढ़ें।"
          : "Forecast, not a measurement. Tab to a point or read the table."}
      </p>
      <svg
        className="forecast-chart"
        viewBox="0 0 600 180"
        role="img"
        aria-label={
          hi
            ? "घंटेवार PM2.5 रुझान; नीचे पूरी तालिका"
            : "Hourly PM2.5 trend; full table below"
        }
      >
        <path d="M30 20 V145 H575" fill="none" stroke="currentColor" />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          points={air.hourly.map((h, i) => `${x(i)},${y(h.pm25)}`).join(" ")}
        />
        {air.hourly.map((h, i) => (
          <circle
            key={h.time}
            tabIndex={0}
            cx={x(i)}
            cy={y(h.pm25)}
            r={focused === i ? 6 : 3}
            fill="currentColor"
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
            aria-label={`${h.time}, ${h.pm25} µg/m³`}
          >
            <title>
              {h.time}: {h.pm25} µg/m³
            </title>
          </circle>
        ))}
        <text x="30" y="173" fill="currentColor">
          {air.hourly[0]?.time.slice(5).replace("T", " ")}
        </text>
        <text x="570" y="173" textAnchor="end" fill="currentColor">
          {air.hourly.at(-1)?.time.slice(5).replace("T", " ")}
        </text>
      </svg>
      <p role="status" className="fine">
        {active
          ? `${active.time.replace("T", " ")} · ${active.pm25} µg/m³`
          : `0–${max.toFixed(1)} µg/m³ · ${air.timezone}`}
      </p>
      <details>
        <summary>
          {hi ? "घंटेवार पूर्वानुमान · तालिका" : "Hourly forecast · table"}
        </summary>
        <div className="table-scroll">
          <table>
            <caption>
              {hi ? "अनुमानित PM2.5" : "Modelled PM2.5"}, µg/m³ · {air.timezone}
            </caption>
            <thead>
              <tr>
                <th>{hi ? "समय" : "Time"}</th>
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
    </section>
  );
}
