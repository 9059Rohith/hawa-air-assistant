"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useHawa } from "./Provider";
import { ProfileWizard } from "./ProfileWizard";
import { LocationForm } from "./LocationForm";
import { PlanView } from "./PlanView";
import type { Plan } from "@/domain/types";
const ChatPanel = dynamic(() => import("./ChatPanel"), {
  loading: () => <p role="status">Opening assistant…</p>,
});
export function PlanWorkspace() {
  const { t, profile, location, air, plan, setPlan, setNotice } = useHawa();
  const [busy, setBusy] = useState(false),
    [offline, setOffline] = useState(false),
    [chat, setChat] = useState(false);
  async function generate() {
    if (!location || !air) {
      setNotice(
        "Choose a location and load air data, or enter a manual reading.",
      );
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          location,
          offline,
          ...(air.source === "open-meteo-browser"
            ? { browserAir: { location, air } }
            : air.source !== "open-meteo"
              ? { manualPm: air.pm25 }
              : {}),
        }),
        signal: AbortSignal.timeout(35000),
      });
      if (!response.ok) throw new Error();
      const result = (await response.json()) as Plan;
      if (air.source === "demo") result.air.source = "demo";
      setPlan(result);
      setNotice(
        result.generatedBy === "llm"
          ? "Your AI-personalized plan is ready."
          : "Your rules-based plan is ready. All calculations are available.",
      );
    } catch {
      setNotice(
        "The plan could not be generated. Try rules mode or retry shortly.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="hero compact">
        <h1>{t.plan}</h1>
        <p>
          {profile.lang === "hi"
            ? "अपनी जरूरतें बताएँ। विकल्प तुलना करें।"
            : "Tell us what fits your day. Compare the choices that matter."}
        </p>
      </div>
      {(!location || !air) && <LocationForm />}
      <ProfileWizard onGenerate={() => void generate()} busy={busy} />
      <label className="check offline">
        <input
          type="checkbox"
          checked={offline}
          onChange={(e) => setOffline(e.target.checked)}
        />
        Use rules mode · no AI request
      </label>
      {plan && (
        <>
          <PlanView plan={plan} />
          <button
            className="primary"
            onClick={() => setChat(!chat)}
            aria-expanded={chat}
          >
            {t.ask}
          </button>
          {chat && <ChatPanel plan={plan} offline={offline} />}
        </>
      )}
    </>
  );
}
