"use client";
import { useMemo, useState } from "react";
import { planImpact } from "@/domain/impact";
import type { Plan } from "@/domain/types";
import { sources } from "@/data/sources";
import { useHawa } from "./Provider";
import { ReadAloud } from "./ui";
export function PlanView({ plan }: { plan: Plan }) {
  const { t, profile, setNotice } = useHawa();
  const [excluded, setExcluded] = useState<string[]>([]);
  const hi = profile.lang === "hi";
  const selected = plan.actions.filter((a) => !excluded.includes(a.id));
  const totals = useMemo(
    () => planImpact(selected, plan.profile, plan.air.pm25),
    [selected, plan],
  );
  const summary = `${plan.headline}\n${plan.summary}\n${selected.map((a) => (hi ? a.hi.title : a.title)).join("\n")}\nIllustrative ambient exposure change: ${totals.percent.toFixed(1)}%. Travel CO2e change: ${(totals.co2KgDay * 7).toFixed(2)} kg/week. Not a measured health outcome.`;
  function download() {
    const blob = new Blob(
      [JSON.stringify({ ...plan, impact: totals, actions: selected }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hawa-plan.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({
          title: "HAWA clean-air steps",
          text: selected.map((a) => (hi ? a.hi.title : a.title)).join("\n"),
          url: location.origin,
        });
      else await navigator.clipboard.writeText(summary);
      setNotice("Plan summary shared or copied.");
    } catch {
      setNotice(
        "Sharing was cancelled or unavailable. You can download or print instead.",
      );
    }
  }
  return (
    <section className="plan-results" aria-label="Generated plan">
      <div className="section-top">
        <div>
          <p className="mode">
            {plan.generatedBy === "llm" ? t.ai : t.rules} ·{" "}
            {plan.air.source === "demo"
              ? "Demo data"
              : plan.air.source === "manual"
                ? "Manual data"
                : "Modelled air"}
          </p>
          <h2>{plan.headline}</h2>
          <p>{plan.summary}</p>
        </div>
      </div>
      <div className="metrics">
        <div>
          <strong>{totals.percent.toFixed(1)}%</strong>
          <span>Illustrative exposure reduction</span>
        </div>
        <div>
          <strong>{(totals.co2KgDay * 7).toFixed(2)} kg</strong>
          <span>Travel CO₂e avoided / week</span>
        </div>
        <div>
          <strong>{totals.cigaretteEq.toFixed(2)}</strong>
          <span>Cigarette-equivalent change / day*</span>
        </div>
      </div>
      <p className="fine">
        *Communication aid, not smoking, a clinical measure or a health
        prediction. Ambient-only model, constant PM2.5, adult scenario,
        uncertain mask fit and infiltration. Travel factors are illustrative
        assumptions, not a verified Indian emissions inventory. No numerical
        cooking or waste claims.
      </p>
      <details className="panel">
        <summary>{t.whatif}</summary>
        <p>
          Toggle actions to recompute one combined scenario. Overlapping effects
          are applied only once.
        </p>
        {plan.actions.map((a) => (
          <label key={a.id} className="check">
            <input
              type="checkbox"
              checked={!excluded.includes(a.id)}
              onChange={(e) =>
                setExcluded(
                  e.target.checked
                    ? excluded.filter((id) => id !== a.id)
                    : [...excluded, a.id],
                )
              }
            />
            {hi ? a.hi.title : a.title}
          </label>
        ))}
        <p role="status">
          Selected scenario: {totals.percent.toFixed(1)}% exposure reduction,{" "}
          {(totals.co2KgDay * 7).toFixed(2)} kg CO₂e/week.
        </p>
      </details>
      <ol className="action-list">
        {plan.actions.map((a, i) => {
          const impact = planImpact([a], plan.profile, plan.air.pm25);
          return (
            <li key={a.id}>
              <div className="action-index">
                {String(i + 1).padStart(2, "0")}
              </div>
              <article>
                <small>
                  {a.category} · {a.cost} · effort {a.effort}/3
                </small>
                <h3>{hi ? a.hi.title : a.title}</h3>
                <p>
                  {plan.profile.lang === profile.lang
                    ? a.why
                    : hi
                      ? a.hi.summary
                      : a.summary}
                </p>
                <details>
                  <summary>{t.calculate}</summary>
                  <p>
                    {a.effect === "none"
                      ? "Qualitative guidance; no numerical savings assigned."
                      : `Standalone illustration: ${impact.percent.toFixed(1)}% ambient-exposure reduction; ${(impact.co2KgDay * 7).toFixed(2)} kg CO₂e/week avoided. Combined totals are recomputed, not summed.`}
                  </p>
                  <p>
                    PM2.5: {plan.air.pm25} µg/m³; outdoor time:{" "}
                    {plan.profile.outdoorHours} h/day; room:{" "}
                    {plan.profile.roomArea} m² × 2.7 m. Indoor concentration =
                    outdoor × infiltration × 0.5 / (0.5 + CADR / volume). N95
                    penetration assumption: 0.2; real fit varies. Confidence:
                    low.
                  </p>
                  <p>
                    {a.sources.map((s) => {
                      const source = sources[s as keyof typeof sources];
                      return source ? (
                        <a key={s} href={source.url}>
                          {source.title} ↗{" "}
                        </a>
                      ) : null;
                    })}
                  </p>
                </details>
              </article>
            </li>
          );
        })}
      </ol>
      <section className="panel">
        <h2>{t.indoor}</h2>
        {[
          "Bedroom: keep smoke out; size and maintain filtration.",
          "Kitchen: avoid charring; use outdoor-vented exhaust.",
          "Living room: damp-dust, avoid incense and mosquito coils.",
          "Vehicle: avoid idling; maintain cabin filters.",
        ].map((s) => (
          <label className="check" key={s}>
            <input type="checkbox" />
            {s}
          </label>
        ))}
      </section>
      <details>
        <summary>Seven-day projection table</summary>
        <table>
          <caption>
            Same chosen actions repeated each day · per commuting person
          </caption>
          <thead>
            <tr>
              <th>Day</th>
              <th>Cumulative CO₂e avoided (kg)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }, (_, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{(totals.co2KgDay * (i + 1)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <div className="button-row">
        <button onClick={() => window.print()}>{t.print}</button>
        <button onClick={download}>{t.download}</button>
        <button onClick={() => void share()}>Share / copy</button>
      </div>
      <ReadAloud text={summary} />
    </section>
  );
}
