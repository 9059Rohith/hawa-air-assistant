/** Conservative phrase triage, not a diagnostic or comprehensive symptom checker. */
export function urgent(text: string) {
  return /chest pain|can(?:not|'t) breathe|difficulty breathing|breathing difficulty|severe wheez|blue lips|faint(?:ing|ed)|infant.{0,20}distress|सीने में दर्द|सांस लेने में (?:दिक्कत|तकलीफ)|साँस नहीं|बेहोश|नीले होंठ/i.test(
    text,
  );
}
export const urgentMessage = {
  en: "Seek urgent medical care now for these symptoms. Contact local emergency services. Do not wait for this chat or a pollution forecast. HAWA cannot diagnose or prescribe treatment.",
  hi: "इन लक्षणों के लिए तुरंत आपात चिकित्सा सहायता लें। स्थानीय आपात सेवा से संपर्क करें। इस चैट या प्रदूषण पूर्वानुमान का इंतज़ार न करें। हवा निदान या दवा नहीं बताता।",
};
