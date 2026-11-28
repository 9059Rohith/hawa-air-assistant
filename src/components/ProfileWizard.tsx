"use client";
import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/domain/types";
import { useHawa } from "./Provider";
import { ProfileFields } from "./ProfileFields";
import { profileIssues, type ProfileIssue } from "./profile-validation";
export function ProfileWizard({
  onGenerate,
  busy,
}: {
  onGenerate: () => void;
  busy: boolean;
}) {
  const { profile, setProfile, t, save } = useHawa();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<ProfileIssue[]>([]);
  const [pendingField, setPendingField] = useState<string | null>(null);
  useEffect(() => {
    if (!pendingField) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(pendingField)?.focus();
      setPendingField(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingField, step]);
  const summary = useRef<HTMLDivElement>(null);
  const hi = profile.lang === "hi";
  const titles = hi
    ? ["परिवार", "घर", "यात्रा", "दिनचर्या", "पसंद"]
    : ["Household", "Home", "Mobility", "Lifestyle", "Preferences"];
  const lastStep = titles.length - 1;
  function change<Key extends keyof Profile>(key: Key, value: Profile[Key]) {
    setProfile({
      ...profile,
      [key]: value,
      ...(key === "children" &&
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0
        ? { childAges: profile.childAges.slice(0, value) }
        : {}),
    });
    setErrors([]);
  }
  function validate() {
    const found = profileIssues(profile, hi);
    setErrors(found);
    if (found.length) {
      requestAnimationFrame(() => summary.current?.focus());
      return false;
    }
    return true;
  }
  return (
    <section className="panel wizard" aria-busy={busy}>
      <div className="section-top">
        <h2>{t.profile}</h2>
        <span>
          {step + 1} / {titles.length} · {titles[step]}
        </span>
      </div>
      <ol
        className="wizard-progress"
        aria-label={hi ? "प्रोफ़ाइल चरण" : "Profile steps"}
      >
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
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (validate()) {
            if (step < lastStep) setStep(step + 1);
            else onGenerate();
          }
        }}
      >
        {errors.length > 0 && (
          <div ref={summary} tabIndex={-1} className="warning" role="status">
            <h3>{hi ? "इन मानों की जाँच करें" : "Check these values"}</h3>
            <ul>
              {errors.map((e) => (
                <li key={e.key} id={`${e.key}-error`}>
                  <a
                    href={`#${e.key}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setStep(e.step);
                      setPendingField(e.key);
                    }}
                  >
                    {e.label}: {e.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <fieldset>
          <legend>{titles[step]}</legend>
          <div className="form-grid">
            <ProfileFields
              step={step}
              hi={hi}
              profile={profile}
              change={change}
              errors={errors}
            />
            {step === lastStep && (
              <>
                <p>
                  {hi
                    ? "प्रोफ़ाइल केवल आपकी अनुमति से इस डिवाइस पर सहेजी जाती है। इसमें स्वास्थ्य-संबंधी पसंद हो सकती हैं।"
                    : "Only save if you want this household profile stored on this device. It may include health-risk preferences."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (validate()) save();
                  }}
                >
                  {t.save}
                </button>
              </>
            )}
          </div>
        </fieldset>
        <div className="button-row">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            {t.back}
          </button>
          <button className="primary" disabled={busy} type="submit">
            {busy ? t.loading : step === lastStep ? t.build : t.next}
          </button>
          {step < lastStep && (
            <button
              type="button"
              onClick={() => {
                if (validate()) setStep(lastStep);
              }}
            >
              {hi ? "जाँचें और बनाएँ" : "Review & build"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
