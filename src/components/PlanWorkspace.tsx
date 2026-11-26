"use client";
import { useState } from "react";
import { usePlanGeneration } from "@/hooks/usePlanGeneration";
import ChatPanel from "./ChatPanel";
import { useHawa } from "./Provider";
import { ProfileWizard } from "./ProfileWizard";
import { LocationForm } from "./LocationForm";
import { PlanView } from "./PlanView";
import { planInputsMatch } from "@/lib/plan-context";
export function PlanWorkspace() {
  const { t, profile, location, air, plan } = useHawa();
  const [offline, setOffline] = useState(false),
    [chat, setChat] = useState(false);
  const { busy, generate } = usePlanGeneration(offline);
  const outdated = !!plan && !planInputsMatch(plan, profile, location, air);
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
          {outdated && (
            <section
              className="warning"
              aria-label={
                profile.lang === "hi"
                  ? "योजना अपडेट करें"
                  : "Plan needs updating"
              }
              aria-live="polite"
            >
              <h2>
                {profile.lang === "hi"
                  ? "आपके विकल्प बदल गए हैं"
                  : "Your choices have changed"}
              </h2>
              <p>
                {profile.lang === "hi"
                  ? "नीचे पुरानी योजना है। समीक्षा करके दोबारा बनाएँ ताकि नए विकल्पों से गणना और सलाह मिलें।"
                  : "The plan below uses your previous household choices or air data. Use Review & build to update its calculations and guidance before exporting or asking about it."}
              </p>
            </section>
          )}
          <PlanView key={plan.createdAt} plan={plan} outdated={outdated} />
          <button
            className="primary"
            onClick={() => setChat(!chat)}
            aria-expanded={chat}
            disabled={outdated}
          >
            {t.ask}
          </button>
          {chat && !outdated && <ChatPanel plan={plan} offline={offline} />}
        </>
      )}
    </>
  );
}
