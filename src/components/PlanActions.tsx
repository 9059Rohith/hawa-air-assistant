"use client";
import { useState } from "react";
import type { Impact, Plan } from "@/domain/types";
import { shareFragment } from "@/lib/share";
import { planSummary } from "@/lib/plan-summary";
import { useHawa } from "./Provider";
import { ReadAloud } from "./ReadAloud";

/** Own the snapshot, clipboard and print boundary separately from plan rendering. */
export function PlanActions({
  plan,
  selected,
  impact,
  outdated,
}: {
  plan: Plan;
  selected: Plan["actions"];
  impact: Impact;
  outdated: boolean;
}) {
  const { profile, t, setNotice } = useHawa();
  const [showSummary, setShowSummary] = useState(false);
  const hi = profile.lang === "hi";
  const summary = planSummary(plan, selected, impact, profile.lang);
  const disabled = outdated || selected.length === 0;
  const notify = (en: string, hin: string) => setNotice(hi ? hin : en);
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [JSON.stringify({ ...plan, impact, actions: selected }, null, 2)],
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
    try {
      const url =
        location.origin +
        "/community" +
        shareFragment(
          selected.map((a) => a.id),
          profile.lang,
        );
      const text = selected.map((a) => (hi ? a.hi.title : a.title)).join("\n");
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
      notify(
        "Summary copied with its source and scenario limits.",
        "स्रोत और सीमाओं सहित सारांश कॉपी हुआ।",
      );
    } catch {
      setShowSummary(true);
      notify(
        "Clipboard unavailable. Select the summary text below to copy it.",
        "क्लिपबोर्ड उपलब्ध नहीं है। नीचे का सारांश चुनकर कॉपी करें।",
      );
    }
  }
  return (
    <>
      {disabled && (
        <p id="plan-output-hint" className="fine">
          {outdated
            ? hi
              ? "नए विकल्पों के लिए योजना दोबारा बनाएँ, फिर प्रिंट या साझा करें।"
              : "Rebuild the plan for your changed choices before printing, exporting or sharing."
            : hi
              ? "प्रिंट या साझा करने के लिए कम से कम एक कदम चुनें।"
              : "Select at least one action before printing, exporting or sharing."}
        </p>
      )}
      <div
        className="button-row"
        aria-describedby={disabled ? "plan-output-hint" : undefined}
      >
        <button disabled={disabled} onClick={() => window.print()}>
          {t.print}
        </button>
        <button disabled={disabled} onClick={download}>
          {t.download}
        </button>
        <button disabled={disabled} onClick={() => void share()}>
          {hi ? "लिंक साझा / कॉपी करें" : "Share / copy"}
        </button>
        <button disabled={disabled} onClick={() => void copy()}>
          {hi ? "सारांश कॉपी करें" : "Copy summary"}
        </button>
      </div>
      {!disabled && (
        <details
          className="panel plan-copy-summary"
          open={showSummary}
          onToggle={(e) => setShowSummary(e.currentTarget.open)}
        >
          <summary>
            {hi ? "सारांश पढ़ें या कॉपी करें" : "Read or copy the summary"}
          </summary>
          <label htmlFor="plan-summary-text">
            {hi
              ? "स्रोत और सीमाओं सहित सारांश"
              : "Summary with source and limits"}
          </label>
          <textarea id="plan-summary-text" readOnly rows={10} value={summary} />
        </details>
      )}
      {!disabled && <ReadAloud text={summary} />}
    </>
  );
}
