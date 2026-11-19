"use client";
import { useState } from "react";
import { knowledge } from "@/data/knowledge";
import { sources } from "@/data/sources";
import { BANDS } from "@/domain/aqi";
import { purifierSize } from "@/domain/impact";
import { useHawa } from "./Provider";
export function Learn() {
  const { profile, t } = useHawa();
  const [query, setQuery] = useState(""),
    [area, setArea] = useState(20);
  const valid = Number.isFinite(area) && area >= 5 && area <= 150;
  const size = valid ? purifierSize(area) : null;
  const hi = profile.lang === "hi";
  const items = knowledge.filter((a) =>
    `${a.title} ${a.summary} ${a.hi.summary}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <section className="hero compact">
        <h1>{t.learn}</h1>
        <p>
          {hi
            ? "हवा को समझें। बेहतर कदम चुनें।"
            : "Understand the air. Choose a better next step."}
        </p>
      </section>
      <section className="panel">
        <h2>PM2.5, explained</h2>
        <p>
          Fine particles can enter deep into the lungs. The same concentration
          can affect people differently. A single reading is not a diagnosis,
          and no air index captures every pollutant.
        </p>
        <details>
          <summary>US EPA 2024 PM2.5 breakpoints</summary>
          <table>
            <caption>
              24-hour concentration scale; HAWA labels hourly conversions as
              indicative
            </caption>
            <thead>
              <tr>
                <th>Category</th>
                <th>PM2.5 (µg/m³)</th>
                <th>AQI range</th>
              </tr>
            </thead>
            <tbody>
              {BANDS.map((b) => (
                <tr key={b.label}>
                  <td>{hi ? b.hiLabel : b.label}</td>
                  <td>
                    {b.lo}–{b.hi}
                  </td>
                  <td>
                    {b.a}–{b.b}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
      <section className="panel">
        <h2>Size your room’s purifier</h2>
        <label htmlFor="area">Room area (m²)</label>
        <input
          id="area"
          type="number"
          min={5}
          max={150}
          value={area}
          onChange={(e) => setArea(Number(e.target.value))}
        />
        <p role="status">
          {size
            ? `Illustrative CADR target: ${size.min}–${size.max} m³/h, assuming a 2.7 m ceiling and 4–5 air changes per hour.`
            : "Enter a room area between 5 and 150 m²."}
        </p>
        <p>
          Check the manufacturer’s smoke CADR, operating speed and noise.
          Filters do not remove carbon monoxide. This sizing target is a design
          assumption, not a medical standard.
        </p>
      </section>
      <section>
        <h2>{hi ? "सलाह पुस्तकालय" : "The clean-air library"}</h2>
        <label htmlFor="knowledge-search">Search guidance / सलाह खोजें</label>
        <input
          id="knowledge-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mask, cooking, school…"
        />
        <p role="status">{items.length} guidance items</p>
        {items.map((a) => (
          <details className="library-item" id={a.id} key={a.id}>
            <summary>{hi ? a.hi.title : a.title}</summary>
            <p>{hi ? a.hi.summary : a.summary}</p>
            <p>
              {a.category} · {a.cost}
            </p>
            {a.sources.map((id) => (
              <a key={id} href={sources[id as keyof typeof sources].url}>
                {sources[id as keyof typeof sources].title}
              </a>
            ))}
          </details>
        ))}
      </section>
      <section id="sources">
        <h2>{t.sources}</h2>
        <ul>
          {Object.values(sources).map((s) => (
            <li key={s.url}>
              <a href={s.url}>{s.title}</a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
