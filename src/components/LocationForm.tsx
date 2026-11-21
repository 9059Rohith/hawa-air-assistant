"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Location } from "@/domain/types";
import { useHawa } from "./Provider";
import { Field } from "./ui";
export function LocationForm() {
  const {
    t,
    profile,
    location,
    setLocation,
    setAir,
    setPlan,
    setNotice,
    resetSignal,
  } = useHawa();
  const hi = profile.lang === "hi";
  const [q, setQ] = useState(""),
    [active, setActive] = useState(-1),
    [results, setResults] = useState<Location[]>([]),
    [busy, setBusy] = useState(false),
    [manual, setManual] = useState("");
  const searchAbort = useRef<AbortController | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadId = useRef(0);
  const invalidate = useCallback(() => {
    ++loadId.current;
    searchAbort.current?.abort();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);
  const stop = useCallback(() => {
    invalidate();
    setResults([]);
    setActive(-1);
    setBusy(false);
  }, [invalidate]);
  useEffect(() => {
    stop();
    setQ("");
    setManual("");
    return invalidate;
  }, [resetSignal, stop, invalidate]);
  async function load(l: Location) {
    stop();
    const id = ++loadId.current;
    searchAbort.current?.abort();
    setResults([]);
    setActive(-1);
    setLocation(l);
    setAir(null);
    setPlan(null);
    setBusy(true);
    try {
      const { loadBrowserAir } = await import("@/lib/browser-air");
      if (id !== loadId.current || resetSignal.aborted) return;
      const reading = await loadBrowserAir(l);
      if (id !== loadId.current || resetSignal.aborted) return;
      setAir(reading);
      setNotice(
        reading.stale
          ? "Cached air data shown. Live refresh is temporarily unavailable."
          : "Air data updated directly from Open-Meteo.",
      );
    } catch {
      if (id !== loadId.current || resetSignal.aborted) return;
      setNotice(
        "Live data is unavailable. Retry or enter a PM2.5 reading below.",
      );
    } finally {
      if (id === loadId.current && !resetSignal.aborted) setBusy(false);
    }
  }
  const search = useCallback(async () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (q.trim().length < 2) return;
    stop();
    const id = loadId.current;
    const controller = new AbortController();
    searchAbort.current = controller;
    setBusy(true);
    try {
      const { searchLocations } = await import("@/lib/location-client");
      const places = await searchLocations(
        q,
        AbortSignal.any([controller.signal, resetSignal]),
      );
      if (id !== loadId.current || resetSignal.aborted) return;
      setResults(places);
      setActive(-1);
      setNotice(
        places.length
          ? `${places.length} locations found. Choose one below.`
          : "No locations found. Try a nearby city.",
      );
    } catch {
      if (controller.signal.aborted || resetSignal.aborted) return;
      setNotice(
        "Search is unavailable. Try a nearby city or enter PM2.5 manually.",
      );
    } finally {
      if (id === loadId.current && !resetSignal.aborted) setBusy(false);
    }
  }, [q, setNotice, resetSignal, stop]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (q.trim().length >= 2) void search();
    }, 250);
    debounceTimer.current = timer;
    return () => {
      clearTimeout(timer);
      searchAbort.current?.abort();
    };
  }, [q, search]);
  function locate() {
    stop();
    if (!navigator.geolocation) {
      setNotice("Location access is unavailable. Search for your city.");
      return;
    }
    const id = loadId.current;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (id !== loadId.current || resetSignal.aborted) return;
        void load({
          name: "Your approximate location",
          lat: Math.round(p.coords.latitude * 100) / 100,
          lon: Math.round(p.coords.longitude * 100) / 100,
        });
      },
      () => {
        if (id !== loadId.current || resetSignal.aborted) return;
        setBusy(false);
        setNotice("Location was not shared. Search for your city instead.");
      },
      { timeout: 10000 },
    );
  }
  return (
    <section className="panel location-panel" aria-busy={busy}>
      <h2>{t.find}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <div className="search-row">
          <Field id="city" label={t.find}>
            <input
              id="city"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={results.length > 0}
              aria-controls="city-results"
              aria-activedescendant={
                active >= 0 ? `city-option-${active}` : undefined
              }
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  stop();
                }
                if (e.key === "ArrowDown" && results.length) {
                  e.preventDefault();
                  setActive((i) => (i + 1) % results.length);
                }
                if (e.key === "ArrowUp" && results.length) {
                  e.preventDefault();
                  setActive((i) => (i - 1 + results.length) % results.length);
                }
                if (e.key === "Enter" && active >= 0 && results[active]) {
                  e.preventDefault();
                  void load(results[active]);
                }
              }}
              value={q}
              onChange={(e) => {
                stop();
                setQ(e.target.value);
              }}
              minLength={2}
              maxLength={80}
              required
              placeholder="Delhi, Lucknow, Kolkata…"
              autoComplete="address-level2"
            />
          </Field>
          <button disabled={busy} type="submit">
            {busy ? "…" : hi ? "खोजें" : "Search"}
          </button>
        </div>
      </form>
      <div className="button-row">
        {busy && (
          <button onClick={stop}>{hi ? "अनुरोध रोकें" : "Stop request"}</button>
        )}
        <button disabled={busy} onClick={locate}>
          {t.location}
        </button>
        {location && <span>{location.name}</span>}
      </div>
      <p className="fine">
        {hi
          ? "ब्राउज़र गोल किए निर्देशांक से Open-Meteo डेटा लेता है। खाते या API कुंजी की ज़रूरत नहीं।"
          : "Live readings are requested from Open-Meteo by your browser using rounded coordinates. No account or API key is needed."}
      </p>
      {results.length > 0 && (
        <ul
          id="city-results"
          role="listbox"
          className="location-results"
          aria-label="Search results"
        >
          {results.map((l, i) => (
            <li role="presentation" key={`${l.lat},${l.lon}`}>
              <button
                role="option"
                id={`city-option-${i}`}
                aria-selected={i === active}
                onClick={() => {
                  setResults([]);
                  void load(l);
                }}
              >
                {i + 1}. {l.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="manual"
        onSubmit={(e) => {
          e.preventDefault();
          const pm25 = Number(manual);
          if (
            manual === "" ||
            !Number.isFinite(pm25) ||
            pm25 < 0 ||
            pm25 > 1000
          ) {
            setNotice("Enter a PM2.5 value between 0 and 1000.");
            return;
          }
          stop();
          if (!location)
            setLocation({ name: "Manual reading", lat: 0, lon: 0 });
          setAir({
            pm25,
            hourly: [],
            source: "manual",
            stale: false,
            observedAt: new Date().toISOString(),
            fetchedAt: new Date().toISOString(),
            timezone: "UTC",
          });
          setPlan(null);
          setNotice(
            "Using your manual reading. No live forecast is available.",
          );
        }}
      >
        <Field label={`${t.manual} (µg/m³)`} id="pm">
          <input
            id="pm"
            type="number"
            min={0}
            max={1000}
            step="0.1"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="e.g. 120"
            required
          />
        </Field>
        <button type="submit">
          {hi ? "रीडिंग इस्तेमाल करें" : "Use reading"}
        </button>
      </form>
    </section>
  );
}
