"use client";
import { useState } from "react";
import { useHawa } from "./Provider";
import { Field } from "./ui";
import { ProfileSchema, type Profile } from "@/domain/types";
type NumberKey =
  | "adults"
  | "children"
  | "elders"
  | "roomArea"
  | "cadr"
  | "km"
  | "occupancy"
  | "outdoorHours"
  | "wfhDays";
type BooleanKey =
  | "higherRisk"
  | "pregnant"
  | "pets"
  | "purifier"
  | "exhaust"
  | "transit"
  | "schoolRun"
  | "exercise"
  | "simple";
export function ProfileWizard({
  onGenerate,
  busy,
}: {
  onGenerate: () => void;
  busy: boolean;
}) {
  const { profile, setProfile, t, save } = useHawa();
  const [step, setStep] = useState(0),
    [error, setError] = useState("");
  const hi = profile.lang === "hi";
  const titles = hi
    ? ["परिवार", "घर", "यात्रा", "दिनचर्या", "पसंद"]
    : ["Household", "Home", "Mobility", "Lifestyle", "Preferences"];
  function num(key: NumberKey, label: string, min: number, max: number) {
    return (
      <Field key={key} id={key} label={label}>
        <input
          id={key}
          type="number"
          min={min}
          max={max}
          step={key === "outdoorHours" ? 0.5 : 1}
          required
          value={profile[key]}
          onChange={(e) =>
            setProfile({ ...profile, [key]: Number(e.target.value) })
          }
        />
      </Field>
    );
  }
  function check(key: BooleanKey, label: string) {
    return (
      <label className="check" key={key}>
        <input
          type="checkbox"
          checked={profile[key]}
          onChange={(e) => setProfile({ ...profile, [key]: e.target.checked })}
        />
        {label}
      </label>
    );
  }
  function select(key: keyof Profile, label: string, options: string[]) {
    return (
      <Field id={key} label={label}>
        <select
          id={key}
          value={String(profile[key])}
          onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </Field>
    );
  }
  return (
    <section className="panel wizard">
      <div className="section-top">
        <h2>{t.profile}</h2>
        <span>
          {step + 1} / 5 · {titles[step]}
        </span>
      </div>
      <ol className="wizard-progress" aria-label="Profile steps">
        {titles.map((title, i) => (
          <li key={title}>
            <button
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
            >
              {i + 1}. {title}
            </button>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const valid = ProfileSchema.safeParse(profile);
          if (!valid.success) {
            setError(
              hi
                ? "मान्य संख्या और विकल्प भरें।"
                : "Please check all profile values. Numbers must stay within the displayed limits.",
            );
            return;
          }
          setError("");
          if (step < 4) setStep(step + 1);
          else onGenerate();
        }}
      >
        <fieldset>
          <legend>{titles[step]}</legend>
          <div className="form-grid">
            {step === 0 && (
              <>
                {num("adults", hi ? "वयस्क" : "Adults", 1, 20)}
                {num("children", hi ? "बच्चे" : "Children", 0, 15)}
                {num("elders", hi ? "बुज़ुर्ग" : "Older adults", 0, 10)}
                {check(
                  "higherRisk",
                  hi
                    ? "किसी को हृदय या साँस की बीमारी है"
                    : "Someone has a heart or respiratory condition",
                )}
                {check(
                  "pregnant",
                  hi ? "गर्भावस्था" : "Pregnancy in household",
                )}
                {check("pets", hi ? "पालतू जानवर" : "Pets at home")}
              </>
            )}
            {step === 1 && (
              <>
                {select("sealing", hi ? "घर की सीलिंग" : "Window sealing", [
                  "sealed",
                  "typical",
                  "leaky",
                ])}
                {num(
                  "roomArea",
                  hi ? "कमरा क्षेत्र (m²)" : "Room floor area (m²)",
                  5,
                  150,
                )}
                {check("purifier", hi ? "फ़िल्टर है" : "I have a purifier")}
                {num("cadr", "Purifier CADR (m³/h)", 0, 2000)}
                {check(
                  "exhaust",
                  hi ? "रसोई एग्ज़ॉस्ट" : "Kitchen exhaust available",
                )}
                {select("cooking", hi ? "खाना पकाने का ईंधन" : "Cooking fuel", [
                  "lpg",
                  "induction",
                  "biomass",
                ])}
                {select("heating", hi ? "हीटिंग" : "Heating", [
                  "none",
                  "electric",
                  "coal_wood",
                ])}
              </>
            )}
            {step === 2 && (
              <>
                {select("mode", hi ? "मुख्य यात्रा" : "Main commute mode", [
                  "car",
                  "bus",
                  "metro",
                  "cycle",
                  "walk",
                  "ev",
                  "motorcycle",
                ])}
                {num(
                  "km",
                  hi ? "दैनिक यात्रा (km)" : "Daily travel distance (km)",
                  0,
                  300,
                )}
                {num(
                  "occupancy",
                  hi ? "कार में यात्री" : "Car occupancy",
                  1,
                  8,
                )}
                {check(
                  "transit",
                  hi ? "बस या मेट्रो उपलब्ध" : "Bus or metro available",
                )}
                {check("schoolRun", hi ? "स्कूल यात्रा" : "School run")}
              </>
            )}
            {step === 3 && (
              <>
                {num(
                  "outdoorHours",
                  hi ? "बाहर घंटे / दिन" : "Hours outdoors per day",
                  0,
                  24,
                )}
                {num(
                  "wfhDays",
                  hi
                    ? "घर से काम के दिन / सप्ताह"
                    : "Possible work-from-home days per week",
                  0,
                  7,
                )}
                {check("exercise", hi ? "बाहर कसरत" : "Outdoor exercise")}
                {select("budget", hi ? "बजट" : "Budget", [
                  "free",
                  "low",
                  "medium",
                ])}
              </>
            )}
            {step === 4 && (
              <>
                {select("lang", hi ? "भाषा" : "Language", ["en", "hi"])}
                {check("simple", t.simple)}
                <p>
                  Only save if you want this household profile stored on this
                  device. Otherwise it stays in this tab until you leave.
                </p>
                <button type="button" onClick={save}>
                  {t.save}
                </button>
              </>
            )}
          </div>
        </fieldset>
        {error && (
          <p role="status" className="warning">
            {error}
          </p>
        )}
        <div className="button-row">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            {t.back}
          </button>
          <button className="primary" disabled={busy} type="submit">
            {busy ? t.loading : step === 4 ? t.build : t.next}
          </button>
          {step < 4 && (
            <button
              type="button"
              onClick={() => {
                setStep(4);
              }}
            >
              Review & build
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
