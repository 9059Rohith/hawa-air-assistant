"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useHawa } from "./Provider";
export function Header() {
  const { profile, setProfile, t, clear } = useHawa();
  const path = usePathname();
  const [theme, setTheme] = useState("system");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hawa-theme");
      if (saved && ["system", "light", "dark", "hc"].includes(saved))
        setTheme(saved);
    } catch {}
  }, []);
  useEffect(() => {
    const system = matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (system.matches ? "dark" : "light") : theme;
    };
    update();
    system.addEventListener("change", update);
    return () => system.removeEventListener("change", update);
  }, [theme]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content / मुख्य सामग्री
      </a>
      <header>
        <div className="nav-inner">
          <Link className="brand" href="/" aria-label="HAWA home">
            HAWA <span aria-hidden="true">≋</span>
          </Link>
          <nav aria-label="Main navigation">
            {[
              ["/", t.today],
              ["/plan", t.plan],
              ["/community", t.community],
              ["/learn", t.learn],
              ["/about", t.about],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href!}
                aria-current={path === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="preferences">
            <button
              onClick={() =>
                setProfile({
                  ...profile,
                  lang: profile.lang === "en" ? "hi" : "en",
                })
              }
              lang={profile.lang === "en" ? "hi" : "en"}
            >
              {profile.lang === "en" ? "हिन्दी" : "English"}
            </button>
            <label className="sr-only" htmlFor="theme">
              Theme
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => {
                setTheme(e.target.value);
                try {
                  localStorage.setItem("hawa-theme", e.target.value);
                } catch {}
              }}
            >
              <option value="system">
                {profile.lang === "hi" ? "सिस्टम" : "System"}
              </option>
              <option value="light">
                {profile.lang === "hi" ? "हल्का" : "Light"}
              </option>
              <option value="dark">
                {profile.lang === "hi" ? "गहरा" : "Dark"}
              </option>
              <option value="hc">
                {profile.lang === "hi" ? "उच्च कंट्रास्ट" : "High contrast"}
              </option>
            </select>
          </div>
        </div>
      </header>
      <div className="privacy-tools">
        <label>
          <input
            type="checkbox"
            checked={profile.simple}
            onChange={(e) =>
              setProfile({ ...profile, simple: e.target.checked })
            }
          />
          {t.simple}
        </label>
        <button className="text-button" onClick={clear}>
          {t.clear}
        </button>
      </div>
    </>
  );
}
