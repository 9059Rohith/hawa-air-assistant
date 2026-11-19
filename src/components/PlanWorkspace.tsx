"use client";
import { useState } from "react";
import { usePlanGeneration } from "@/hooks/usePlanGeneration";
import ChatPanel from "./ChatPanel";
import { useHawa } from "./Provider";
import { ProfileWizard } from "./ProfileWizard";
import { LocationForm } from "./LocationForm";
import { PlanView } from "./PlanView";
export function PlanWorkspace() {
  const { t, profile, location, air, plan } = useHawa();
  const [offline, setOffline] = useState(false),
    [chat, setChat] = useState(false);
  const { busy, generate } = usePlanGeneration(offline);
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
        {profile.lang === "hi"
          ? "स्थानीय नियम मोड · AI अनुरोध नहीं"
          : "Use rules mode · no AI request"}
      </label>
      {plan && (
        <>
          <PlanView key={plan.createdAt} plan={plan} />
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
