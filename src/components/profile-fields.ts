import type { Profile } from "@/domain/types";
type KeysOfType<Value> = {
  [Key in keyof Profile]: Profile[Key] extends Value ? Key : never;
}[keyof Profile];

type FieldLabel = { en: string; hi: string };
type Numeric = FieldLabel & {
  key: KeysOfType<number>;
  min: number;
  max: number;
  step?: number;
};
type ChoiceKey = KeysOfType<string>;
type Choice = {
  [Key in ChoiceKey]: FieldLabel & {
    key: Key;
    options: readonly Profile[Key][];
  };
}[ChoiceKey];
type Checkbox = FieldLabel & { key: KeysOfType<boolean> };

export const numbers: Numeric[][] = [
  [
    { key: "adults", en: "Adults", hi: "वयस्क", min: 1, max: 20 },
    { key: "children", en: "Children", hi: "बच्चे", min: 0, max: 15 },
    { key: "elders", en: "Older adults", hi: "बुज़ुर्ग", min: 0, max: 10 },
  ],
  [
    { key: "floor", en: "Floor above ground", hi: "मंज़िल", min: 0, max: 100 },
    {
      key: "roomArea",
      en: "Room floor area (m²)",
      hi: "कमरा क्षेत्र (m²)",
      min: 5,
      max: 150,
    },
    {
      key: "ceiling",
      en: "Ceiling height (m)",
      hi: "छत की ऊँचाई (m)",
      min: 2,
      max: 6,
      step: 0.1,
    },
    {
      key: "cadr",
      en: "Purifier CADR (m³/h)",
      hi: "फ़िल्टर CADR (m³/h)",
      min: 0,
      max: 2000,
    },
    {
      key: "cookingHours",
      en: "Cooking hours / day",
      hi: "खाना पकाने के घंटे / दिन",
      min: 0,
      max: 12,
      step: 0.5,
    },
    {
      key: "heatingHours",
      en: "Heating hours / day",
      hi: "हीटिंग के घंटे / दिन",
      min: 0,
      max: 24,
      step: 0.5,
    },
  ],
  [
    {
      key: "km",
      en: "Daily travel distance (km)",
      hi: "दैनिक यात्रा (km)",
      min: 0,
      max: 300,
    },
    {
      key: "occupancy",
      en: "Vehicle occupants / fare-paying passengers",
      hi: "वाहन में यात्री / किराया देने वाले यात्री",
      min: 1,
      max: 8,
    },
  ],
  [
    {
      key: "outdoorHours",
      en: "Hours outdoors per day",
      hi: "बाहर घंटे / दिन",
      min: 0,
      max: 24,
      step: 0.5,
    },
    {
      key: "wfhDays",
      en: "Possible work-from-home days per week",
      hi: "घर से काम के दिन / सप्ताह",
      min: 0,
      max: 7,
    },
    {
      key: "timeMinutes",
      en: "Time available for changes (minutes/day)",
      hi: "बदलाव के लिए समय (मिनट/दिन)",
      min: 5,
      max: 180,
    },
  ],
  [],
];
export const choices: Choice[][] = [
  [],
  [
    {
      key: "dwelling",
      en: "Home type",
      hi: "घर का प्रकार",
      options: ["apartment", "house", "hostel"],
    },
    {
      key: "sealing",
      en: "Window sealing",
      hi: "खिड़की की सीलिंग",
      options: ["sealed", "typical", "leaky"],
    },
    {
      key: "ventilation",
      en: "Ventilation",
      hi: "हवादारी",
      options: ["limited", "windows", "filtered"],
    },
    {
      key: "cooking",
      en: "Cooking fuel",
      hi: "खाना पकाने का ईंधन",
      options: ["lpg", "png", "induction", "biomass", "mixed", "kerosene"],
    },
    {
      key: "heating",
      en: "Heating",
      hi: "हीटिंग",
      options: ["none", "electric", "gas", "coal_wood", "ac_heat", "kerosene"],
    },
  ],
  [
    {
      key: "mode",
      en: "Main commute mode",
      hi: "मुख्य यात्रा",
      options: [
        "car",
        "bus",
        "metro",
        "cycle",
        "walk",
        "ev",
        "motorcycle",
        "auto",
        "erickshaw",
      ],
    },
    {
      key: "vehicleFuel",
      en: "Vehicle fuel",
      hi: "वाहन का ईंधन",
      options: ["petrol", "diesel", "cng", "electric"],
    },
  ],
  [
    {
      key: "activity",
      en: "Usual outdoor activity",
      hi: "बाहर की सामान्य गतिविधि",
      options: ["rest", "walking", "running"],
    },
    {
      key: "mask",
      en: "Usual adult face covering",
      hi: "वयस्क का सामान्य मास्क",
      options: ["none", "cloth", "surgical", "n95"],
    },
    {
      key: "budget",
      en: "Budget",
      hi: "बजट",
      options: ["free", "low", "medium"],
    },
  ],
  [{ key: "lang", en: "Language", hi: "भाषा", options: ["en", "hi"] }],
];
export const checks: Checkbox[][] = [
  [
    {
      key: "higherRisk",
      en: "Someone has a heart or respiratory condition",
      hi: "किसी को हृदय या साँस की बीमारी है",
    },
    { key: "pregnant", en: "Pregnancy in household", hi: "गर्भावस्था" },
    { key: "pets", en: "Pets at home", hi: "पालतू जानवर" },
  ],
  [
    { key: "purifier", en: "I have a purifier", hi: "फ़िल्टर है" },
    {
      key: "exhaust",
      en: "Kitchen exhaust available",
      hi: "रसोई एग्ज़ॉस्ट है",
    },
  ],
  [
    {
      key: "transit",
      en: "Bus or metro available",
      hi: "बस या मेट्रो उपलब्ध है",
    },
    { key: "schoolRun", en: "School run", hi: "स्कूल यात्रा" },
  ],
  [{ key: "exercise", en: "Outdoor exercise", hi: "बाहर कसरत" }],
  [{ key: "simple", en: "Simple words", hi: "आसान शब्द" }],
];
const labels: Record<string, [string, string]> = {
  apartment: ["Apartment", "फ़्लैट"],
  house: ["House", "मकान"],
  hostel: ["Hostel / shared room", "छात्रावास / साझा कमरा"],
  sealed: ["Sealed", "अच्छी सीलिंग"],
  typical: ["Typical", "सामान्य"],
  leaky: ["Leaky", "दरारें हैं"],
  limited: ["Limited", "कम"],
  windows: ["Windows", "खिड़कियाँ"],
  filtered: ["Filtered ventilation", "फ़िल्टर वाली हवादारी"],
  lpg: ["LPG", "एलपीजी"],
  png: ["PNG / natural gas", "पाइप वाली गैस"],
  induction: ["Induction", "इंडक्शन"],
  biomass: ["Wood / dung / biomass", "लकड़ी / उपले"],
  mixed: ["Mixed fuels", "मिले-जुले ईंधन"],
  kerosene: ["Kerosene", "मिट्टी का तेल"],
  none: ["None", "नहीं"],
  electric: ["Electric", "बिजली"],
  gas: ["Gas", "गैस"],
  coal_wood: ["Coal / wood", "कोयला / लकड़ी"],
  ac_heat: ["Heat pump / AC heating", "हीट पंप / एसी हीटिंग"],
  car: ["Car", "कार"],
  bus: ["Bus", "बस"],
  metro: ["Metro", "मेट्रो"],
  cycle: ["Cycle", "साइकिल"],
  walk: ["Walk", "पैदल"],
  ev: ["Electric car", "इलेक्ट्रिक कार"],
  motorcycle: ["Motorcycle", "मोटरसाइकिल"],
  auto: ["Auto-rickshaw", "ऑटो रिक्शा"],
  erickshaw: ["E-rickshaw", "ई-रिक्शा"],
  petrol: ["Petrol", "पेट्रोल"],
  diesel: ["Diesel", "डीज़ल"],
  cng: ["CNG", "सीएनजी"],
  rest: ["Rest / seated", "आराम / बैठना"],
  walking: ["Walking", "चलना"],
  running: ["Running", "दौड़ना"],
  cloth: ["Cloth", "कपड़े का मास्क"],
  surgical: ["Surgical", "सर्जिकल मास्क"],
  n95: ["N95 / FFP2", "N95 / FFP2"],
  free: ["Free", "बिना खर्च"],
  low: ["Low cost", "कम खर्च"],
  medium: ["Medium budget", "मध्यम बजट"],
  en: ["English", "English"],
  hi: ["हिन्दी", "हिन्दी"],
};
export function optionLabel(value: string, hi: boolean) {
  return labels[value]?.[hi ? 1 : 0] ?? value;
}
