"use client";
import { useState } from "react";
import { knowledge } from "@/data/knowledge";
import { sources } from "@/data/sources";
import { BANDS } from "@/domain/aqi";
import { purifierSize } from "@/domain/impact";
import { useHawa } from "./Provider";
import { FuelCalculator } from "./FuelCalculator";
export function Learn() {
  const { profile, t } = useHawa();
  const hi = profile.lang === "hi";
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
      <AirExplanation hi={hi} />
      <PurifierSizing hi={hi} />
      <FuelCalculator hi={hi} />
      <FiltrationGlossary hi={hi} />
      <GuidanceLibrary hi={hi} />
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

function AirExplanation({ hi }: { hi: boolean }) {
  return (
    <section className="panel">
      <h2>{hi ? "PM2.5 को समझें" : "PM2.5, explained"}</h2>
      <p>
        {hi
          ? "बारीक कण फेफड़ों में गहराई तक जा सकते हैं। एक ही सांद्रता लोगों को अलग तरह प्रभावित कर सकती है। अकेली रीडिंग निदान नहीं है और कोई सूचकांक हर प्रदूषक नहीं दिखाता।"
          : "Fine particles can enter deep into the lungs. The same concentration can affect people differently. A single reading is not a diagnosis, and no air index captures every pollutant."}
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
              <th>{hi ? "श्रेणी" : "Category"}</th>
              <th>PM2.5 (µg/m³)</th>
              <th>{hi ? "AQI सीमा" : "AQI range"}</th>
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
  );
}

function PurifierSizing({ hi }: { hi: boolean }) {
  const [area, setArea] = useState(20),
    [height, setHeight] = useState(2.7);
  const valid =
    Number.isFinite(area) &&
    area >= 5 &&
    area <= 150 &&
    Number.isFinite(height) &&
    height >= 2 &&
    height <= 6;
  const size = valid ? purifierSize(area, height) : null;
  return (
    <>
      {" "}
      <section className="panel">
        <h2>
          {hi ? "कमरे के लिए फ़िल्टर का आकार" : "Size your room’s purifier"}
        </h2>
        <label htmlFor="area">
          {hi ? "कमरे का क्षेत्रफल (m²)" : "Room area (m²)"}
        </label>
        <input
          id="area"
          type="number"
          min={5}
          max={150}
          value={area}
          onChange={(e) => setArea(Number(e.target.value))}
        />
        <label>
          {hi ? "छत की ऊँचाई (m)" : "Ceiling height (m)"}
          <input
            type="number"
            min={2}
            max={6}
            step="0.1"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </label>
        <p role="status">
          {size
            ? `Illustrative CADR target: ${size.min}–${size.max} m³/h, assuming a ${height} m ceiling and 4–5 air changes per hour.`
            : "Enter a room area between 5 and 150 m² and a ceiling height between 2 and 6 m."}
        </p>
        <p>
          {hi
            ? "निर्माता का smoke CADR, गति और शोर जाँचें। फ़िल्टर कार्बन मोनोऑक्साइड नहीं हटाते। यह डिज़ाइन का अनुमान है, चिकित्सकीय मानक नहीं।"
            : "Check the manufacturer’s smoke CADR, operating speed and noise. Filters do not remove carbon monoxide. This sizing target is a design assumption, not a medical standard."}
        </p>
      </section>
    </>
  );
}

function FiltrationGlossary({ hi }: { hi: boolean }) {
  return (
    <>
      {" "}
      <section className="panel">
        <h2>
          {hi ? "DIY फ़िल्टर और शब्दावली" : "DIY filtration and glossary"}
        </h2>
        <details>
          <summary>
            {hi ? "अस्थायी बॉक्स-फैन फ़िल्टर" : "Temporary box-fan filter"}
          </summary>
          <p>
            {hi
              ? "केवल 2012 या बाद का UL/ETL प्रमाणित बॉक्स फैन और MERV 13 फ़िल्टर लें। फ़िल्टर को फैन के पीछे लगाएँ, तीर हवा की दिशा में रखें और जोड़ बंद करें। स्थानीय वोल्टेज और निर्माता के निर्देश जाँचें। पुराने या क्षतिग्रस्त फैन से न बनाएँ। यह गैस या CO नहीं हटाता।"
              : "Use a UL/ETL-certified box fan made in 2012 or later and a MERV 13 filter. Attach the filter behind the fan, with its airflow arrow toward the fan, and seal gaps. Check local voltage compatibility and manufacturer instructions. Do not improvise with old or damaged fans. This does not remove gases or carbon monoxide."}
          </p>
          <a href="https://www.epa.gov/emergencies-iaq/diy-air-cleaners">
            EPA · DIY air-cleaner instructions and safety
          </a>
        </details>
        <dl>
          <dt>PM2.5</dt>
          <dd>
            {hi
              ? "2.5 माइक्रोमीटर या छोटे कण।"
              : "Particles 2.5 micrometres or smaller."}
          </dd>
          <dt>CADR</dt>
          <dd>
            {hi
              ? "फ़िल्टर द्वारा साफ हवा देने की दर।"
              : "Clean air delivery rate at a specified operating speed."}
          </dd>
          <dt>ACH</dt>
          <dd>
            {hi
              ? "प्रति घंटे कमरे के आयतन के बराबर हवा बदलने की दर।"
              : "Equivalent room volumes of air changed per hour."}
          </dd>
          <dt>AQI</dt>
          <dd>
            {hi
              ? "प्रदूषण बताने का सूचकांक; देश और प्रदूषक के अनुसार पैमाना बदलता है।"
              : "An air-quality index; scales differ by jurisdiction and pollutant."}
          </dd>
        </dl>
      </section>
    </>
  );
}

function GuidanceLibrary({ hi }: { hi: boolean }) {
  const [query, setQuery] = useState("");
  const items = knowledge.filter((a) =>
    [a.title, a.summary, a.hi.title, a.hi.summary]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <>
      {" "}
      <section>
        <h2>{hi ? "सलाह पुस्तकालय" : "The clean-air library"}</h2>
        <label htmlFor="knowledge-search">Search guidance / सलाह खोजें</label>
        <input
          id="knowledge-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mask, cooking, school…"
        />
        <p role="status">
          {items.length} {hi ? "सलाह के विषय" : "guidance items"}
        </p>
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
    </>
  );
}
