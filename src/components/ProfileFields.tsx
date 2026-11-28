import type { Profile } from "@/domain/types";
import { numbers, choices, checks, optionLabel } from "./profile-fields";
import type { ProfileIssue } from "./profile-validation";
import { Field } from "./ui";

type FieldProps = {
  hi: boolean;
  profile: Profile;
  change: <Key extends keyof Profile>(key: Key, value: Profile[Key]) => void;
  errors: ProfileIssue[];
};

function validationAttributes(
  errors: ProfileIssue[],
  key: keyof Profile,
  hint?: string,
) {
  const invalid = errors.some((issue) => issue.key === key);
  const description = [hint, invalid && `${key}-error`]
    .filter(Boolean)
    .join(" ");
  return {
    "aria-invalid": invalid,
    "aria-describedby": description || undefined,
  };
}

export function ProfileFields({
  step,
  hi,
  profile,
  change,
  errors,
}: FieldProps & { step: number }) {
  return (
    <>
      {(numbers[step] ?? []).map((field) => (
        <Field key={field.key} id={field.key} label={hi ? field.hi : field.en}>
          <input
            id={field.key}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            required
            value={
              Number.isFinite(profile[field.key])
                ? String(profile[field.key])
                : ""
            }
            {...validationAttributes(errors, field.key, `${field.key}-hint`)}
            onChange={(e) =>
              change(
                field.key,
                e.target.value === "" ? NaN : Number(e.target.value),
              )
            }
          />
          <small id={`${field.key}-hint`}>
            {field.min}–{field.max}
          </small>
        </Field>
      ))}
      {(choices[step] ?? []).map((field) => (
        <Field key={field.key} id={field.key} label={hi ? field.hi : field.en}>
          <select
            id={field.key}
            {...validationAttributes(errors, field.key)}
            value={profile[field.key]}
            onChange={(event) => {
              const option = field.options.find(
                (value) => value === event.currentTarget.value,
              );
              if (option !== undefined) change(field.key, option);
            }}
          >
            {field.options.map((option) => (
              <option key={option} value={option}>
                {optionLabel(option, hi)}
              </option>
            ))}
          </select>
        </Field>
      ))}
      {(checks[step] ?? []).map((field) => (
        <label className="check" key={field.key}>
          <input
            id={field.key}
            type="checkbox"
            {...validationAttributes(errors, field.key)}
            checked={profile[field.key]}
            onChange={(e) => change(field.key, e.target.checked)}
          />
          {hi ? field.hi : field.en}
        </label>
      ))}
      {step === 0 && profile.children > 0 && (
        <ChildAges profile={profile} hi={hi} errors={errors} change={change} />
      )}
    </>
  );
}

function ChildAges({ profile, hi, errors, change }: FieldProps) {
  return (
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
        key={profile.childAges.join(",")}
        defaultValue={profile.childAges.join(", ")}
        inputMode="text"
        {...validationAttributes(errors, "childAges")}
        onBlur={(e) =>
          change(
            "childAges",
            e.target.value.trim()
              ? e.target.value
                  .split(",")
                  .map((v) => (v.trim() ? Number(v.trim()) : NaN))
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
  );
}
