import type { Impact, Plan } from "@/domain/types";

/** Keep provenance and modelling limits attached when text leaves the app. */
export function planSummary(
  plan: Plan,
  selected: Plan["actions"],
  impact: Impact,
  lang: "en" | "hi",
) {
  const hi = lang === "hi";
  const source = {
    demo: hi
      ? "उदाहरण डेटा — वर्तमान हवा नहीं"
      : "Illustrative demo — not current air",
    manual: hi ? "हाथ से भरा PM2.5" : "User-entered PM2.5",
    "open-meteo": "Open-Meteo / CAMS",
    "open-meteo-browser": "Open-Meteo / CAMS",
  }[plan.air.source];
  return [
    hi ? "HAWA · चुनी गई योजना का सारांश" : "HAWA · Selected plan summary",
    plan.location.name,
    `${source}${plan.air.stale ? (hi ? " · पुराना डेटा" : " · stale data") : ""}`,
    `PM2.5: ${plan.air.pm25} µg/m³ · ${plan.air.observedAt} (${plan.air.timezone})`,
    `${hi ? "योजना बनी" : "Plan generated"}: ${plan.createdAt}`,
    "",
    ...selected.map((action) => `• ${hi ? action.hi.title : action.title}`),
    "",
    `${hi ? "अनुमानित एक्सपोज़र कमी" : "Illustrative exposure reduction"}: ${impact.percent.toFixed(1)}%`,
    `${hi ? "एक वयस्क यात्री का यात्रा CO₂ परिदृश्य / सप्ताह" : "One adult commuter's travel CO₂ scenario / week"}: ${(impact.co2KgDay * 7).toFixed(2)} kg`,
    hi
      ? "कम विश्वास वाला उदाहरण; व्यक्तिगत माप या स्वास्थ्य लाभ की भविष्यवाणी नहीं। सात दिन वही यात्रा मान ली गई है।"
      : "Low-confidence scenario, not measured personal exposure or a health prediction. Assumes the same commute for seven days.",
    hi
      ? "सामान्य मार्गदर्शन, चिकित्सकीय सलाह नहीं। स्थानीय आधिकारिक सूचना का पालन करें।"
      : "General guidance, not medical advice. Follow local official advisories.",
    "https://hawa-air-assistant.vabjashwanthreddy.chatgpt.site/about",
  ].join("\n");
}
