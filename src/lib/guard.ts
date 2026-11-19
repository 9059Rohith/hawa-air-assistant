/** Normalize untrusted input without following or silently granting its instructions. */
function normalized(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g, "");
}
export function scrubUserText(text: string) {
  return normalized(text)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/<\/?user_data>|```/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);
}
export function detectInjection(text: string) {
  return /ignore.{0,25}(?:previous|instructions)|reveal.{0,20}(?:key|prompt)|system prompt|role.?play as/i.test(
    normalized(text),
  );
}
export function unsafeProse(text: string) {
  if (/\p{N}/u.test(normalized(text))) return true;
  return /[\d०-९]|https?:|www\.|@|<|>|\b(?:dosage|cure|guarantee)\b|\b(?:take|increase|decrease|start|stop|double)\b.{0,45}\b(?:tablets?|pills?|aspirin|steroids?|dose|medication)\b|\b(?:half|double|triple|percent|percentage)\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b.{0,15}\b(?:tablets?|pills?|percent|grams?|hours?|minutes?)\b|दवा.{0,12}(?:मात्रा|बढ़ा|घटा)|आधी.{0,15}(?:दवा|खुराक)/i.test(
    normalized(text),
  );
}
/** Transport carbon factors cannot establish an individual's inhaled exposure. */
export function groundedWhy(
  action: { category: string; summary: string; hi: { summary: string } },
  proposed: string,
  lang: "en" | "hi",
) {
  const overpromise =
    /maximum protection|ensure.{0,15}(?:safety|protection)|पूर्ण सुरक्षा|पूरी सुरक्षा/i.test(
      normalized(proposed),
    );
  // Keep this category curated: a phrase blacklist cannot establish route exposure.
  return overpromise || action.category === "Transport"
    ? lang === "hi"
      ? action.hi.summary
      : action.summary
    : proposed;
}
