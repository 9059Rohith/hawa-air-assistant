"use client";
import { useEffect, useRef, useState } from "react";
import { useHawa } from "@/components/Provider";
import { localPlan } from "@/lib/rules-plan";
import { requestPlan } from "@/lib/plan-client";
export function usePlanGeneration(offline: boolean) {
  const { profile, location, air, setPlan, setNotice } = useHawa();
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    setBusy(false);
    return () => active.current?.abort();
  }, [profile, location, air]);
  async function generate() {
    if (!location || !air) {
      setNotice(
        "Choose a location and load air data, or enter a manual reading.",
      );
      return;
    }
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const current = () =>
      active.current === controller && !controller.signal.aborted;
    setBusy(true);
    try {
      if (offline || !navigator.onLine) {
        setPlan(localPlan(profile, location, air));
        setNotice(
          profile.lang === "hi"
            ? "इस डिवाइस पर नियम आधारित योजना तैयार है।"
            : "Your local rules-based plan is ready. No network request was needed.",
        );
        return;
      }
      const result = await requestPlan(
        profile,
        location,
        air,
        controller.signal,
      );
      if (!current()) return;
      if (air.source === "demo") result.air.source = "demo";
      setPlan(result);
      setNotice(
        result.generatedBy === "llm"
          ? "Your AI-personalized plan is ready."
          : "Your rules-based plan is ready. All calculations are available.",
      );
    } catch {
      if (!current()) return;
      setPlan(localPlan(profile, location, air));
      setNotice(
        profile.lang === "hi"
          ? "AI उपलब्ध नहीं है। स्थानीय नियम योजना तैयार है।"
          : "AI is unavailable. A local rules-based plan is ready.",
      );
    } finally {
      if (current()) setBusy(false);
    }
  }

  return { busy, generate };
}
