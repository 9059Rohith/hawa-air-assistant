"use client";
import type { Plan } from "@/domain/types";
import { planImpact } from "@/domain/impact";
import { bestWindow } from "@/domain/aqi";
import { sources } from "@/data/sources";
import { optionLabel } from "./profile-fields";
export function ActionCard({
  action: a,
  plan,
  index,
  hi,
}: {
  action: Plan["actions"][number];
  plan: Plan;
  index: number;
  hi: boolean;
}) {
  const when = actionTiming(a, plan, hi);
  return (
    <li>
      <div className="action-index">{String(index + 1).padStart(2, "0")}</div>
      <article>
        <small>
          {a.category} · {optionLabel(a.cost, hi)} · {hi ? "प्रयास" : "effort"}{" "}
          {a.effort}/3 · {a.minutes} {hi ? "मिनट" : "min"}
        </small>
        <h3>{hi ? a.hi.title : a.title}</h3>
        <p>
          {plan.profile.lang === (hi ? "hi" : "en")
            ? a.why
            : hi
              ? a.hi.summary
              : a.summary}
        </p>
        <p className="fine">
          {when} ·{" "}
          {hi
            ? "सुझाया गया समय; अपने दिन के अनुसार बदलें"
            : "Suggested timing; adapt to your day"}
        </p>
        <details>
          <summary>{hi ? "कदम और सावधानियाँ" : "Steps and caveats"}</summary>
          <ol>
            {(hi ? a.hi.steps : a.steps).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {(hi ? a.hi.caveats : a.caveats).map((s) => (
            <p key={s} className="fine">
              {s}
            </p>
          ))}
        </details>
        <ActionImpact action={a} plan={plan} hi={hi} />
        <ActionCalculation action={a} plan={plan} hi={hi} />
      </article>
    </li>
  );
}

type ActionDetails = {
  action: Plan["actions"][number];
  plan: Plan;
  hi: boolean;
};
function ActionImpact({ action: a, plan, hi }: ActionDetails) {
  const impact = planImpact([a], plan.profile, plan.air.pm25);
  return (
    <div className="impact-card">
      {a.effect === "none" ? (
        <p>
          {hi
            ? "गुणात्मक लाभ — इस कदम के लिए संख्यात्मक बचत निर्धारित नहीं है।"
            : "Qualitative benefit — numerical savings have not been established for this action."}
        </p>
      ) : (
        <>
          <label>
            {hi ? "अनुमानित एक्सपोज़र बदलाव" : "Illustrative exposure change"}:{" "}
            {impact.percent.toFixed(1)}%
            <meter
              min={0}
              max={100}
              value={impact.percent}
              aria-label={
                hi
                  ? "अनुमानित एक्सपोज़र कमी"
                  : "Illustrative exposure reduction"
              }
            />
          </label>
          <p>
            {(impact.baseline - impact.after).toFixed(1)} µg/m³·h ·{" "}
            {(impact.co2KgDay * 7).toFixed(2)} kg CO₂/
            {hi ? "सप्ताह" : "week"}
          </p>
          <p>
            {impact.cigaretteEq.toFixed(2)}{" "}
            {hi
              ? "सिगरेट-समतुल्य बदलाव/दिन; चिकित्सकीय माप नहीं"
              : "cigarette-equivalent change/day; not a clinical measure"}
          </p>
          <small>
            {hi
              ? "विश्वास: कम — अनुमानित परिस्थितियाँ"
              : "Confidence: low — scenario assumptions"}
          </small>
        </>
      )}
    </div>
  );
}
function ActionCalculation({ action: a, plan, hi }: ActionDetails) {
  return (
    <details>
      <summary>{hi ? "हमने गणना कैसे की" : "How we calculated this"}</summary>
      <p>
        {a.effect === "none"
          ? hi
            ? "गुणात्मक सलाह; कोई संख्यात्मक बचत नहीं जोड़ी गई।"
            : "Qualitative guidance; no numerical savings assigned."
          : hi
            ? "अलग कार्रवाई का अनुमान है। कुल परिणाम दोबारा गणना होते हैं; प्रतिशत जोड़े नहीं जाते।"
            : "Standalone illustration. Combined totals are recomputed, not summed."}
      </p>
      <p>
        PM2.5: {plan.air.pm25} µg/m³; {hi ? "बाहर" : "outdoors"}:{" "}
        {plan.profile.outdoorHours} h; {plan.profile.roomArea} m² ×{" "}
        {plan.profile.ceiling} m.{" "}
        {hi
          ? "घर में सांद्रता = बाहर × प्रवेश अनुपात × 0.5 / (0.5 + CADR / आयतन)। मास्क फिट और गतिविधि वास्तविक परिणाम बदलते हैं।"
          : "Indoor concentration = outdoor × infiltration × 0.5 / (0.5 + CADR / volume). Mask fit and activity vary."}
      </p>
      <p>
        {hi
          ? "यात्रा: प्रति व्यक्ति दूरी × उत्सर्जन गुणांक; साझा वाहन में यात्री गिनें। PM की श्रेणियाँ गुणात्मक हैं।"
          : "Travel: per-person distance × emissions factor; vehicle occupancy matters. PM source categories are qualitative."}
      </p>
      <p>
        {a.sources.map((id) => {
          const s = sources[id as keyof typeof sources];
          return s ? (
            <a key={id} href={s.url}>
              {s.title} ↗{" "}
            </a>
          ) : null;
        })}
      </p>
      <a href="/about">
        {hi ? "सभी सूत्र, स्रोत और सीमाएँ" : "All formulas, sources and limits"}
      </a>
    </details>
  );
}

function actionTiming(a: Plan["actions"][number], plan: Plan, hi: boolean) {
  const window = bestWindow(plan.air.hourly);
  return a.id === "forecast" && window
    ? window.time.replace("T", " ")
    : a.category === "Transport"
      ? hi
        ? "यात्रा से पहले"
        : "Before travel"
      : hi
        ? "आज, सुविधानुसार"
        : "Today, when practical";
}
