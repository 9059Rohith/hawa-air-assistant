"use client";
import { useState } from "react";
import { AirSchema, LocationSchema, type Location } from "@/domain/types";
import { useHawa } from "./Provider";
import { Field } from "./ui";
export function LocationForm() {
  const { t, location, setLocation, setAir, setNotice } = useHawa();
  const [q, setQ] = useState(""),
    [results, setResults] = useState<Location[]>([]),
    [busy, setBusy] = useState(false),
    [manual, setManual] = useState("");
  async function load(l: Location) {
    setLocation(l);
    setBusy(true);
    try {
      const response = await fetch(`/api/air?lat=${l.lat}&lon=${l.lon}`);
      if (!response.ok) throw new Error();
      setAir(AirSchema.parse(await response.json()));
      setNotice("Air data updated.");
    } catch {
      setNotice(
        "Live data is unavailable. Retry or enter a PM2.5 reading below.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function search() {
    setBusy(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (!response.ok) throw new Error();
      const places = LocationSchema.array().parse(await response.json());
      setResults(places);
      setNotice(
        places.length
          ? `${places.length} locations found. Choose one below.`
          : "No locations found. Try a nearby city.",
      );
    } catch {
      setNotice(
        "Search is unavailable. Try a nearby city or enter PM2.5 manually.",
      );
    } finally {
      setBusy(false);
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      setNotice("Location access is unavailable. Search for your city.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        void load({
          name: "Your approximate location",
          lat: Math.round(p.coords.latitude * 100) / 100,
          lon: Math.round(p.coords.longitude * 100) / 100,
        }),
      () => setNotice("Location was not shared. Search for your city instead."),
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
              value={q}
              onChange={(e) => setQ(e.target.value)}
              minLength={2}
              maxLength={80}
              required
              placeholder="Delhi, Lucknow, Kolkata…"
              autoComplete="address-level2"
            />
          </Field>
          <button disabled={busy} type="submit">
            {busy ? "…" : "Search"}
          </button>
        </div>
      </form>
      <div className="button-row">
        <button onClick={locate}>{t.location}</button>
        {location && <span>{location.name}</span>}
      </div>
      {results.length > 0 && (
        <ul className="location-results" aria-label="Search results">
          {results.map((l, i) => (
            <li key={`${l.lat},${l.lon}`}>
              <button
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
        <button type="submit">Use reading</button>
      </form>
    </section>
  );
}
