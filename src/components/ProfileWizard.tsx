"use client";
import { useRef, useState } from "react";
import { ProfileSchema, type Profile } from "@/domain/types";
import { useHawa } from "./Provider";
import { Field } from "./ui";
import { numbers, choices, checks, optionLabel } from "./profile-fields";
export function ProfileWizard({
  onGenerate,
  busy,
}: {
  onGenerate: () => void;
  busy: boolean;
}) {
  const { profile, setProfile, t, save } = useHawa();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<{ key: string; message: string }[]>([]);
  const summary = useRef<HTMLDivElement>(null);
  const hi = profile.lang === "hi";
  const titles = hi
    ? ["परिवार", "घर", "यात्रा", "दिनचर्या", "पसंद"]
    : ["Household", "Home", "Mobility", "Lifestyle", "Preferences"];
  function change(key: keyof Profile, value: Profile[keyof Profile]) {
    setProfile({
      ...profile,
      [key]: value,
      ...(key === "children"
        ? { childAges: profile.childAges.slice(0, Number(value)) }
        : {}),
    });
    setErrors([]);
  }
  function validate() {
    const parsed = ProfileSchema.safeParse(profile);
    const found = parsed.success
      ? []
      : parsed.error.issues.map((e) => ({
          key: String(e.path[0]),
          message: hi
            ? "दिखाई गई सीमा में मान भरें।"
            : "Enter a value within the displayed limits.",
        }));
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
          {step + 1} / 5 · {titles[step]}
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
            if (step < 4) setStep(step + 1);
            else onGenerate();
          }
        }}
      >
        {errors.length > 0 && (
          <div ref={summary} tabIndex={-1} className="warning" role="status">
            <h3>{hi ? "इन मानों की जाँच करें" : "Check these values"}</h3>
            <ul>
              {errors.map((e) => (
                <li key={e.key}>
                  <a
                    href={`#${e.key}`}
                    onClick={() => {
                      const target = numbers.findIndex((group) =>
                        group.some((f) => f.key === e.key),
                      );
                      if (target >= 0) setStep(target);
                    }}
                  >
                    {e.key}: {e.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <fieldset>
          <legend>{titles[step]}</legend>
          <div className="form-grid">
            {(numbers[step] ?? []).map((f) => (
              <Field key={f.key} id={f.key} label={hi ? f.hi : f.en}>
                <input
                  id={f.key}
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step ?? 1}
                  required
                  value={
                    Number.isFinite(profile[f.key])
                      ? String(profile[f.key])
                      : ""
                  }
                  aria-invalid={errors.some((e) => e.key === f.key)}
                  aria-describedby={`${f.key}-hint`}
                  onChange={(e) =>
                    change(
                      f.key,
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                />
                <small id={`${f.key}-hint`}>
                  {f.min}–{f.max}
                </small>
              </Field>
            ))}
            {(choices[step] ?? []).map((f) => (
              <Field key={f.key} id={f.key} label={hi ? f.hi : f.en}>
                <select
                  id={f.key}
                  value={String(profile[f.key])}
                  onChange={(e) =>
                    change(f.key, e.target.value as Profile[keyof Profile])
                  }
                >
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {optionLabel(o, hi)}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
            {(checks[step] ?? []).map((f) => (
              <label className="check" key={f.key}>
                <input
                  type="checkbox"
                  checked={Boolean(profile[f.key])}
                  onChange={(e) => change(f.key, e.target.checked)}
                />
                {hi ? f.hi : f.en}
              </label>
            ))}
            {step === 0 && profile.children > 0 && (
              <Field
                id="childAges"
                label={
                  hi
                    ? "बच्चों की उम्र (वर्ष, अल्पविराम से अलग; वैकल्पिक)"
                    : "Children’s ages (years, comma-separated; optional)"
                }
              >
                <input
                  id="childAges"
                  defaultValue={profile.childAges.join(", ")}
                  inputMode="numeric"
                  onBlur={(e) =>
                    change(
                      "childAges",
                      e.target.value.trim()
                        ? e.target.value
                            .split(",")
                            .slice(0, 15)
                            .map((v) => Number(v.trim()))
                        : [],
                    )
                  }
                />
                <small>
                  {hi
                    ? "दो वर्ष से छोटे बच्चे को मास्क न पहनाएँ।"
                    : "Never put a mask on a child under two."}
                </small>
              </Field>
            )}
            {step === 4 && (
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
            {busy ? t.loading : step === 4 ? t.build : t.next}
          </button>
          {step < 4 && (
            <button
              type="button"
              onClick={() => {
                if (validate()) setStep(4);
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
