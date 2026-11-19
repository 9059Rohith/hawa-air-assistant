"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { baseProfile } from "@/data/personas";
import type { Profile, Location, Air, Plan } from "@/domain/types";
import { copy } from "@/i18n";
type State = {
  profile: Profile;
  setProfile: (p: Profile) => void;
  location: Location | null;
  setLocation: (l: Location) => void;
  air: Air | null;
  setAir: (a: Air | null) => void;
  plan: Plan | null;
  setPlan: (p: Plan | null) => void;
  notice: string;
  setNotice: (s: string) => void;
  save: () => void;
  clear: () => void;
  t: typeof copy.en | typeof copy.hi;
};
const Context = createContext<State | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const edited = useRef(false);
  const [profile, setProfile] = useState(baseProfile),
    [location, setLocation] = useState<Location | null>(null),
    [air, setAir] = useState<Air | null>(null),
    [plan, setPlan] = useState<Plan | null>(null),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const value = localStorage.getItem("hawa-profile-v1");
        const lang = localStorage.getItem("hawa-language");
        if (
          !value &&
          (lang === "en" || lang === "hi") &&
          active &&
          !edited.current
        )
          setProfile((p) => ({ ...p, lang }));
        if (value) {
          const { ProfileSchema } = await import("@/domain/types");
          const parsed = ProfileSchema.parse(JSON.parse(value));
          if (active && !edited.current) setProfile(parsed);
        }
      } catch {
        setNotice(
          "Saved preferences could not be read. You can continue without saving.",
        );
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = profile.lang;
  }, [profile.lang]);
  function save() {
    try {
      localStorage.setItem("hawa-profile-v1", JSON.stringify(profile));
      setNotice(
        profile.lang === "hi"
          ? "प्रोफ़ाइल सहेजी गई।"
          : "Profile saved on this device. It includes your household risk preferences.",
      );
    } catch {
      setNotice("Storage is unavailable. Your profile has not been saved.");
    }
  }
  function clear() {
    edited.current = true;
    try {
      localStorage.removeItem("hawa-profile-v1");
      localStorage.removeItem("hawa-language");
      setProfile(baseProfile);
      setPlan(null);
      setLocation(null);
      setAir(null);
      setNotice("Local profile and current plan cleared.");
    } catch {
      setNotice(
        "Storage is blocked. Clear this site's data in browser settings.",
      );
    }
  }
  return (
    <Context.Provider
      value={{
        profile,
        setProfile: (value) => {
          edited.current = true;
          setProfile(value);
          try {
            localStorage.setItem("hawa-language", value.lang);
          } catch {}
        },
        location,
        setLocation,
        air,
        setAir,
        plan,
        setPlan,
        notice,
        setNotice,
        save,
        clear,
        t: copy[profile.lang],
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useHawa() {
  const state = useContext(Context);
  if (!state) throw new Error("HAWA provider required");
  return state;
}
