"use client";
import { useState } from "react";
import { communityImpact } from "@/domain/impact";
import { useHawa } from "./Provider";
import { ReadAloud } from "./ui";
export function Community() {
  const { t, profile, plan, setNotice } = useHawa();
  const [count, setCount] = useState(100),
    [adoption, setAdoption] = useState(30),
    [kind, setKind] = useState("Neighbourhood");
  const hi = profile.lang === "hi";
  const days = hi
    ? [
        "हवा का स्रोत तय करें",
        "कचरा न जलाने का संकल्प",
        "फ़िल्टर और साफ कमरे की जाँच",
        "साझा यात्रा की योजना",
        "संवेदनशील पड़ोसियों की मदद",
        "धूल की सुरक्षित रिपोर्ट",
        "सीख और अगले कदम साझा करें",
      ]
    : [
        "Agree a trusted local air-data source",
        "Commit to no waste burning",
        "Check filters and designate a clean-air room",
        "Coordinate safe shared transport",
        "Check on higher-risk neighbours with consent",
        "Report persistent dust through official channels",
        "Review what worked and plan the next week",
      ];
  const valid = Number.isInteger(count) && count >= 1 && count <= 10000;
  const kg = valid
    ? communityImpact(plan?.impact.co2KgDay ?? 0, count, adoption)
    : 0;
  const notice = hi
    ? `${kind}: इस सप्ताह साफ हवा के छोटे कदम अपनाएँ। कचरा न जलाएँ, इंजन बेवजह चालू न रखें, और स्थानीय हवा के अनुसार गतिविधि बदलें। संवेदनशील पड़ोसियों की मदद उनकी अनुमति से करें।`
    : `${kind}: join our clean-air week. Keep waste out of fires, avoid unnecessary idling, and adjust activities to local air conditions. Check on higher-risk neighbours with their consent.`;
  return (
    <>
      <section className="hero compact">
        <h1>{t.community}</h1>
        <p>
          {hi
            ? "एक घर से पूरे मोहल्ले तक।"
            : "From one household to a whole neighbourhood."}
        </p>
      </section>
      <section className="panel">
        <div className="form-grid">
          <label>
            Community type
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option>Neighbourhood</option>
              <option>School</option>
              <option>Apartment society</option>
            </select>
          </label>
          <label>
            Households
            <input
              type="number"
              min={1}
              max={10000}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </label>
          <label>
            Participation: {adoption}%
            <input
              type="range"
              min={0}
              max={100}
              value={adoption}
              onChange={(e) => setAdoption(Number(e.target.value))}
            />
          </label>
        </div>
        {!valid && <p role="status">Enter 1–10,000 households.</p>}
        <h2>Collective impact scenario</h2>
        <p>
          {plan && valid
            ? `About ${kg.toFixed(1)} kg travel CO₂e/week avoided if each participating household repeats the same single-commuter scenario.`
            : "Build a household plan first to calculate a community scenario."}
        </p>
        <p className="fine">
          Households × participation × one commuter’s daily saving × seven days.
          Not a forecast or measured result. No household health effects are
          multiplied.
        </p>
      </section>
      <section className="community-kit">
        <h2>
          {hi
            ? "सात दिन की साफ हवा चुनौती"
            : "Your seven-day clean-air challenge"}
        </h2>
        <ol className="week-list">
          {days.map((day, i) => (
            <li key={day}>
              <strong>0{i + 1}</strong>
              <span>{day}</span>
              <input aria-label={`Complete day ${i + 1}`} type="checkbox" />
            </li>
          ))}
        </ol>
        <div className="panel">
          <h2>Notice-board / WhatsApp text</h2>
          <p>{notice}</p>
          <div className="button-row">
            <button
              onClick={() => {
                void navigator.clipboard.writeText(notice).then(
                  () => setNotice("Community notice copied."),
                  () =>
                    setNotice(
                      "Clipboard unavailable. Select the notice text to copy it.",
                    ),
                );
              }}
            >
              Copy notice
            </button>
            <button onClick={() => window.print()}>{t.print}</button>
          </div>
        </div>
        <h2>Report safely</h2>
        <p>
          Record the time, location and visible issue without confrontation. Use
          your municipal authority or pollution-control board’s official
          complaint channel. Do not publish neighbours’ personal details. For
          urgent breathing symptoms, seek medical help.
        </p>
        <ReadAloud text={`${notice} ${days.join(". ")}`} />
      </section>
    </>
  );
}
