"use client";
import Link from "next/link";
import { useHawa } from "./Provider";
import { LocationForm } from "./LocationForm";
import { AirCard } from "./AirCard";
import { personas, cities } from "@/data/personas";
import { useRouter } from "next/navigation";
export function Home() {
  const { t, setProfile, setLocation, setAir, setNotice } = useHawa();
  const router = useRouter();
  return (
    <>
      <section className="hero">
        <h1>{t.hero}</h1>
        <p>{t.sub}</p>
      </section>
      <div className="home-grid">
        <div>
          <LocationForm />
          <Link className="primary full" href="/plan">
            {t.build} <span aria-hidden="true">→</span>
          </Link>
        </div>
        <AirCard />
      </div>
      <section className="steps">
        <h2>{t.steps}</h2>
        <div className="three-columns">
          {[t.know, t.personal, t.impact].map((v, i) => (
            <div className="step" key={v}>
              <span>{i + 1}</span>
              <div>
                <h3>{v}</h3>
                <p>
                  {
                    [
                      "Check modelled air or enter your sensor reading.",
                      "Choose practical steps that fit your household.",
                      "Compare transparent scenarios, with assumptions.",
                    ][i]
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="persona-strip">
        <div>
          <h2>Try a household example</h2>
          <p>Illustrative PM2.5 of 120 µg/m³ · not live data</p>
        </div>
        <div className="button-row">
          {Object.entries(personas).map(([name, p], i) => (
            <button
              key={name}
              onClick={() => {
                setProfile(p);
                setLocation([cities.Delhi, cities.Lucknow, cities.Kolkata][i]!);
                setAir({
                  pm25: 120,
                  hourly: [],
                  fetchedAt: new Date().toISOString(),
                  observedAt: new Date().toISOString(),
                  source: "demo",
                  stale: false,
                  timezone: "Asia/Kolkata",
                });
                setNotice(
                  "Example household loaded. Review its details before generating a plan.",
                );
                router.push("/plan");
              }}
            >
              {name} →
            </button>
          ))}
        </div>
      </section>
      <p className="trust">
        Numbers come from a transparent calculator, not the AI.{" "}
        <Link href="/about">See the assumptions →</Link>
      </p>
    </>
  );
}
