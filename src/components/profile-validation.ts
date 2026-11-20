import { ProfileSchema, type Profile } from "@/domain/types";
import { numbers, choices, checks } from "./profile-fields";
export type ProfileIssue = {
  key: string;
  label: string;
  message: string;
  step: number;
};
type FieldMeta = {
  key: string;
  en: string;
  hi: string;
  step: number;
  min?: number;
  max?: number;
};
const fields: FieldMeta[] = [
  ...numbers.flatMap((group, step) =>
    group.map((field) => ({ ...field, step })),
  ),
  ...choices.flatMap((group, step) =>
    group.map((field) => ({ ...field, step })),
  ),
  ...checks.flatMap((group, step) =>
    group.map((field) => ({ ...field, step })),
  ),
];
function describeIssue(
  key: string,
  profile: Profile,
  hi: boolean,
  whole: boolean,
): ProfileIssue {
  if (key === "childAges")
    return {
      key,
      step: 0,
      label: hi ? "बच्चों की उम्र" : "Children’s ages",
      message:
        profile.childAges.length > profile.children
          ? hi
            ? `अधिकतम ${profile.children} बच्चों की उम्र भरें या बच्चों की संख्या बदलें।`
            : `Enter at most ${profile.children} ages, or update the number of children.`
          : hi
            ? "हर उम्र 0 से 17 तक की पूर्ण संख्या हो। खाली प्रविष्टियाँ हटाएँ।"
            : "Enter whole ages from 0 to 17, separated by commas, without empty entries.",
    };
  const field = fields.find((item) => item.key === key);
  const message = fieldMessage(field, whole, hi);
  return {
    key,
    label: field ? (hi ? field.hi : field.en) : hi ? "प्रोफ़ाइल" : "Profile",
    message,
    step: field?.step ?? 0,
  };
}
/** One human-readable error per field, including cross-field and array failures. */
export function profileIssues(profile: Profile, hi: boolean): ProfileIssue[] {
  const parsed = ProfileSchema.safeParse(profile);
  if (parsed.success) return [];
  const keys = [
    ...new Set(parsed.error.issues.map((issue) => String(issue.path[0]))),
  ];
  return keys.map((key) =>
    describeIssue(
      key,
      profile,
      hi,
      parsed.error.issues.some(
        (issue) =>
          String(issue.path[0]) === key &&
          issue.code === "invalid_type" &&
          issue.expected === "int",
      ),
    ),
  );
}

function fieldMessage(
  field: FieldMeta | undefined,
  whole: boolean,
  hi: boolean,
) {
  if (whole)
    return hi
      ? "पूर्ण संख्या भरें; दशमलव मान न दें।"
      : "Enter a whole number, without decimal places.";
  if (field?.min !== undefined && field.max !== undefined)
    return hi
      ? `${field.min} से ${field.max} के बीच मान भरें।`
      : `Enter a number from ${field.min} to ${field.max}.`;
  return hi
    ? "दिए गए विकल्पों में से मान चुनें।"
    : "Choose one of the available options.";
}
