// @vitest-environment node
import { expect, it } from "vitest";
import { baseProfile, cities } from "@/data/personas";
import { localPlan } from "@/lib/rules-plan";
import { planImpact } from "@/domain/impact";
import { planSummary } from "@/lib/plan-summary";
import type { Air } from "@/domain/types";
const air: Air = {
  pm25: 120,
  hourly: [],
  source: "demo",
  stale: false,
  fetchedAt: "2026-11-27T00:00:00Z",
  observedAt: "2026-11-27T00:00:00Z",
  timezone: "UTC",
};
const plan = localPlan(baseProfile, cities.Delhi, air);

it.each(["en", "hi"] as const)(
  "keeps selected actions, source and limits in %s text",
  (lang) => {
    const selected = plan.actions.slice(0, 1);
    const text = planSummary(
      plan,
      selected,
      planImpact(selected, plan.profile, air.pm25),
      lang,
    );
    expect(text).toContain(
      lang === "hi" ? selected[0]!.hi.title : selected[0]!.title,
    );
    expect(text).not.toContain(
      lang === "hi" ? plan.actions[1]!.hi.title : plan.actions[1]!.title,
    );
    expect(text).toContain("120 µg/m³");
    expect(text).toContain(air.observedAt);
    expect(text).toContain(
      lang === "hi" ? "वर्तमान हवा नहीं" : "not current air",
    );
    expect(text).toContain(
      lang === "hi"
        ? "स्वास्थ्य लाभ की भविष्यवाणी नहीं"
        : "not measured personal exposure",
    );
    expect(text).toContain(
      lang === "hi" ? "चिकित्सकीय सलाह नहीं" : "not medical advice",
    );
  },
);
it.each(["manual", "open-meteo", "open-meteo-browser"] as const)(
  "retains %s provenance and stale warning",
  (source) => {
    const snapshot = { ...plan, air: { ...air, source, stale: true } };
    for (const lang of ["en", "hi"] as const) {
      const text = planSummary(
        snapshot,
        snapshot.actions,
        snapshot.impact,
        lang,
      );
      expect(text).toContain(lang === "hi" ? "पुराना डेटा" : "stale data");
      expect(text).toContain(
        source === "manual"
          ? lang === "hi"
            ? "हाथ से भरा"
            : "User-entered"
          : "Open-Meteo / CAMS",
      );
      expect(text).not.toContain('"profile"');
    }
  },
);
