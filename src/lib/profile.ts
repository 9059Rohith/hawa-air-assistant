import { ProfileSchema } from "@/domain/types";

/** Device storage is untrusted. Parse only bounded data; recent language wins. */
export function readProfile(value: string, language: string | null) {
  if (value.length > 8192) throw new RangeError("Saved profile is too large.");
  const profile = ProfileSchema.parse(JSON.parse(value));
  return {
    ...profile,
    lang: language === "en" || language === "hi" ? language : profile.lang,
  };
}
