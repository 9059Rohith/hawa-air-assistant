"use client";
import { useMemo, useState } from "react";
import { planImpact } from "@/domain/impact";
import type { Plan } from "@/domain/types";
import { useHawa } from "./Provider";
import { ReadAloud } from "./ReadAloud";
import { ActionCard } from "./ActionCard";
import { WeeklyProjection } from "./WeeklyProjection";
import { shareFragment } from "@/lib/share";
export function PlanView({ plan }: { plan: Plan }) {
  const { t, profile, setNotice } = useHawa();
  const hi = profile.lang === "hi";
  const [excluded, setExcluded] = useState<string[]>([]);
  const [commuters, setCommuters] = useState(1);
  const selected = useMemo(
    () => plan.actions.filter((a) => !excluded.includes(a.id)),
    [plan.actions, excluded],
  );
  const totals = useMemo(
    () => planImpact(selected, plan.profile, plan.air.pm25),
    [selected, plan],
  );
  const text = selected.map((a) => (hi ? a.hi.title : a.title)).join("\n");
  const summary = `${plan.headline}\n${text}\n${totals.percent.toFixed(1)}% · ${(totals.co2KgDay * 7).toFixed(2)} kg CO₂/week`;
  const notify = (en: string, hin: string) => setNotice(hi ? hin : en);
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { ...plan, impact: totals, actions: selected },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "hawa-plan.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function share() {
    const url =
      location.origin +
      "/community" +
      shareFragment(
        selected.map((a) => a.id),
        profile.lang,
      );
    try {
      if (navigator.share) await navigator.share({ title: "HAWA", text, url });
      else await navigator.clipboard.writeText(url);
      notify(
        "A link containing only action IDs was shared or copied.",
        "केवल कदमों की पहचान वाला लिंक साझा या कॉपी हुआ।",
      );
    } catch {
      notify(
        "Sharing cancelled or unavailable. Print or download instead.",
        "साझा करना रद्द हुआ या उपलब्ध नहीं है। प्रिंट या डाउनलोड करें।",
      );
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      notify("Summary copied.", "सारांश कॉपी हुआ।");
    } catch {
      notify(
        "Clipboard unavailable. Select the summary text instead.",
        "क्लिपबोर्ड उपलब्ध नहीं है। सारांश चुनकर कॉपी करें।",
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
              ? hi
                ? "उदाहरण डेटा"
                : "Demo data"
              : plan.air.source === "manual"
                ? hi
                  ? "हाथ से भरा डेटा"
                  : "Manual data"
                : hi
                  ? "अनुमानित हवा"
                  : "Modelled air"}
          </p>
          <h2>
            {plan.profile.lang === profile.lang
              ? plan.headline
              : hi
                ? "आज की साफ हवा योजना"
                : "Your smog game plan"}
          </h2>
          <p>
            {plan.profile.lang === profile.lang
              ? plan.summary
              : hi
                ? "घर, सफ़र और समुदाय के लिए चुने गए कदम।"
                : "Selected steps for your home, journey and community."}
          </p>
          <p className="fine">
            {hi ? "बनाया गया" : "Generated"}:{" "}
            {plan.createdAt.slice(0, 16).replace("T", " ")} UTC
          </p>
        </div>
      </div>
      <div className="metrics">
        <div>
          <strong>{totals.percent.toFixed(1)}%</strong>
          <span>
            {hi ? "अनुमानित एक्सपोज़र कमी" : "Illustrative exposure reduction"}
          </span>
        </div>
        <div>
          <strong>{(totals.co2KgDay * 7).toFixed(2)} kg</strong>
          <span>
            {hi ? "यात्रा CO₂ बदलाव / सप्ताह" : "Travel CO₂ avoided / week"}
          </span>
        </div>
        <div>
          <strong>{totals.cigaretteEq.toFixed(2)}</strong>
          <span>
            {hi
              ? "सिगरेट-समतुल्य बदलाव / दिन*"
              : "Cigarette-equivalent change / day*"}
          </span>
        </div>
      </div>
      <p className="fine">
        {hi
          ? "*समझाने का उदाहरण, धूम्रपान या स्वास्थ्य की भविष्यवाणी नहीं। वयस्क परिदृश्य; मास्क फिट, गतिविधि और इमारत के कारण परिणाम बदलते हैं। यात्रा के पुराने संदर्भ गुणांक हैं, मापा गया निजी उत्सर्जन नहीं।"
          : "*Communication aid, not smoking, a clinical measure or a health prediction. Adult scenario with uncertain mask fit, activity and infiltration. Travel uses dated reference factors, not a current fleet inventory or measured personal emissions."}
      </p>
      <details className="panel">
        <summary>{t.whatif}</summary>
        <p>
          {hi
            ? "एक ही प्रभाव दो बार नहीं गिना जाता। कदम बदलकर कुल परिदृश्य देखें।"
            : "Toggle actions to recompute one combined scenario. Overlapping effects are applied only once."}
        </p>
        {plan.actions.map((a) => (
          <label className="check" key={a.id}>
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
          {hi ? "चुना गया परिदृश्य" : "Selected scenario"}:{" "}
          {totals.percent.toFixed(1)}%, {(totals.co2KgDay * 7).toFixed(2)} kg
          CO₂/{hi ? "सप्ताह" : "week"}.
        </p>
      </details>
      <ol className="action-list">
        {plan.actions.map((a, i) => (
          <ActionCard key={a.id} action={a} plan={plan} index={i} hi={hi} />
        ))}
      </ol>
      <section className="panel">
        <h2>{t.indoor}</h2>
        {(hi
          ? [
              "सोने का कमरा: धुआँ बाहर रखें; सही फ़िल्टर और रखरखाव।",
              "रसोई: खाना न जलाएँ; बाहर जाने वाला एग्ज़ॉस्ट चलाएँ।",
              "बैठक: गीले कपड़े से सफ़ाई; अगरबत्ती और धुएँ से बचें।",
              "वाहन: बेवजह इंजन बंद; केबिन फ़िल्टर की देखभाल।",
            ]
          : [
              "Bedroom: keep smoke out; size and maintain filtration.",
              "Kitchen: avoid charring; use outdoor-vented exhaust.",
              "Living room: damp-dust, avoid incense and mosquito coils.",
              "Vehicle: avoid idling; maintain cabin filters.",
            ]
        ).map((s) => (
          <label className="check" key={s}>
            <input type="checkbox" />
            {s}
          </label>
        ))}
      </section>
      <label>
        {hi
          ? "इसी यात्रा वाले वयस्क यात्रियों की संख्या"
          : "Adults repeating this same commute scenario"}
        <input
          type="number"
          min={1}
          max={plan.profile.adults}
          value={commuters}
          onChange={(e) =>
            setCommuters(
              Math.max(
                1,
                Math.min(plan.profile.adults, Number(e.target.value) || 1),
              ),
            )
          }
        />
      </label>
      <p className="fine">
        {hi
          ? "केवल यात्रा की कुल गणना बदलती है; बच्चों या स्वास्थ्य प्रभाव को गुणा नहीं किया जाता।"
          : "Only travel totals scale; child or household health effects are never multiplied."}
      </p>
      <WeeklyProjection kg={totals.co2KgDay * commuters} hi={hi} />
      <div className="button-row">
        <button onClick={() => window.print()}>{t.print}</button>
        <button onClick={download}>{t.download}</button>
        <button disabled={!selected.length} onClick={() => void share()}>
          {hi ? "लिंक साझा / कॉपी करें" : "Share / copy"}
        </button>
        <button onClick={() => void copy()}>
          {hi ? "सारांश कॉपी करें" : "Copy summary"}
        </button>
      </div>
      <ReadAloud text={summary} />
    </section>
  );
}
