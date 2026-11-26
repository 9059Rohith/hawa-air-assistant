import React from "react";
import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { axe } from "jest-axe";
import { Provider, useHawa } from "@/components/Provider";
import { Header } from "@/components/Header";
import { Home } from "@/components/Home";
import { Community } from "@/components/Community";
import { Learn } from "@/components/Learn";
import { ProfileWizard } from "@/components/ProfileWizard";
import { PlanView } from "@/components/PlanView";
import ChatPanel from "@/components/ChatPanel";
import { AirCard } from "@/components/AirCard";
import { Footer, Notice } from "@/components/ui";
import { ReadAloud } from "@/components/ReadAloud";
import { LocationForm } from "@/components/LocationForm";
import { PlanWorkspace } from "@/components/PlanWorkspace";
import { Forecast } from "@/components/Forecast";
import { SharedKit } from "@/components/SharedKit";
import { shareFragment } from "@/lib/share";
import About from "@/app/about/page";
import { baseProfile, cities } from "@/data/personas";
import { knowledge } from "@/data/knowledge";
import { planImpact } from "@/domain/impact";
import type { Plan } from "@/domain/types";
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/dynamic", () => ({ default: () => () => <p>Chat loaded</p> }));
const fixture: Plan = {
  headline: "Your clean-air plan",
  summary: "Take practical steps.",
  generatedBy: "rules",
  profile: baseProfile,
  location: cities.Delhi,
  air: {
    pm25: 130,
    hourly: [
      { time: "2026-11-19T11:00", pm25: 120 },
      { time: "2026-11-19T12:00", pm25: 110 },
    ],
    source: "demo",
    stale: false,
    fetchedAt: "2026-11-19T10:00:00Z",
    observedAt: "2026-11-19T10:00",
    timezone: "Asia/Kolkata",
  },
  actions: knowledge.slice(0, 8).map((a) => ({ ...a, why: a.summary })),
  impact: planImpact(knowledge.slice(0, 8), baseProfile, 130),
  createdAt: "2026-11-19T10:00:00Z",
};
function Seed() {
  const s = useHawa();
  return (
    <>
      <button
        onClick={() => {
          s.setLocation(cities.Delhi);
          s.setAir(fixture.air);
          s.setPlan(fixture);
        }}
      >
        Seed
      </button>
      <button onClick={s.save}>Save</button>
      <button onClick={s.clear}>Clear</button>
      <button onClick={() => s.setProfile({ ...s.profile, lang: "hi" })}>
        Hindi
      </button>
    </>
  );
}
function wrap(node: React.ReactNode) {
  return render(
    <Provider>
      <Seed />
      {node}
      <Notice />
    </Provider>,
  );
}
beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
for (const [name, Component] of [
  ["Home", Home],
  ["Community", Community],
  ["Learn", Learn],
  ["About", About],
] as const)
  it(`${name} has no detectable accessibility violations`, async () => {
    const { container } = wrap(<Component />);
    expect((await axe(container)).violations).toEqual([]);
  });
it("header switches language and all themes", () => {
  wrap(<Header />);
  fireEvent.click(screen.getByRole("button", { name: "हिन्दी" }));
  expect(document.documentElement.lang).toBe("hi");
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  for (const theme of ["dark", "hc", "light"]) {
    fireEvent.change(screen.getByLabelText("Theme"), {
      target: { value: theme },
    });
    expect(document.documentElement.dataset.theme).toBe(theme);
  }
  fireEvent.click(screen.getByLabelText("Simple words"));
  fireEvent.click(screen.getByRole("button", { name: "Clear my data" }));
});
it("profile persistence is opt-in and clearable", () => {
  wrap(<Footer />);
  expect(localStorage.length).toBe(0);
  fireEvent.click(screen.getByText("Save", { exact: true }));
  expect(localStorage.getItem("hawa-profile-v1")).toContain("adults");
  fireEvent.click(screen.getByText("Clear", { exact: true }));
  expect(localStorage.length).toBe(0);
});
it("reports corrupt or blocked storage instead of claiming data saved", async () => {
  localStorage.setItem("hawa-profile-v1", "bad");
  wrap(<Footer />);
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("could not be read"),
  );
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error();
  });
  fireEvent.click(screen.getByText("Save", { exact: true }));
  expect(screen.getByRole("status")).toHaveTextContent("not been saved");
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
    throw new Error();
  });
  fireEvent.click(screen.getByText("Clear", { exact: true }));
  expect(screen.getByRole("status")).toHaveTextContent("Storage is blocked");
});
it("reads a valid saved profile", async () => {
  localStorage.setItem(
    "hawa-profile-v1",
    JSON.stringify({ ...baseProfile, lang: "hi" }),
  );
  wrap(<Footer />);
  await waitFor(() => expect(document.documentElement.lang).toBe("hi"));
});
it("loads sample households without implying live data", () => {
  wrap(<Home />);
  for (const name of ["Meera", "Ramesh", "Ananya"]) {
    fireEvent.click(screen.getByRole("button", { name: `${name} →` }));
    expect(screen.getByRole("status")).toHaveTextContent("Example household");
  }
});
it("restores a newer language choice alongside the saved household", async () => {
  localStorage.setItem(
    "hawa-profile-v1",
    JSON.stringify({ ...baseProfile, adults: 4, lang: "en" }),
  );
  localStorage.setItem("hawa-language", "hi");
  wrap(<Footer />);
  await waitFor(() => expect(document.documentElement.lang).toBe("hi"));
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(JSON.parse(localStorage.getItem("hawa-profile-v1")!)).toMatchObject({
    adults: 4,
    lang: "hi",
  });
});
it("manual PM2.5 creates a labeled data path", async () => {
  wrap(
    <>
      <LocationForm />
      <AirCard />
    </>,
  );
  fireEvent.change(screen.getByLabelText(/Have a PM2.5/), {
    target: { value: "150" },
  });
  fireEvent.click(screen.getByText("Use reading"));
  expect(await screen.findByText(/Your manual reading/)).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Severe pollution");
  fireEvent.click(screen.getByText("Hindi", { exact: true }));
  expect(screen.getByRole("alert")).toHaveTextContent("गंभीर");
});
it("searches a city and loads modelled air", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json([cities.Delhi]))
    .mockResolvedValueOnce(
      Response.json({
        current: { pm2_5: 120, time: "2026-11-19T10:00" },
        hourly: {
          time: ["2026-11-19T10:00", "2026-11-19T11:00", "2026-11-19T12:00"],
          pm2_5: [120, 110, 100],
        },
        timezone: "Asia/Kolkata",
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  wrap(
    <>
      <LocationForm />
      <AirCard />
    </>,
  );
  fireEvent.change(screen.getByLabelText("Find your city"), {
    target: { value: "Delhi" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await screen.findByRole("option", { name: "1. Delhi" });
  fireEvent.click(screen.getByRole("option", { name: "1. Delhi" }));
  await screen.findByText(/not independently verified/);
  expect(screen.getByText(/Lower forecast window/)).toBeInTheDocument();
});
it("handles empty search and upstream errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(Response.json([]))
      .mockRejectedValueOnce(new Error()),
  );
  wrap(<LocationForm />);
  fireEvent.change(screen.getByLabelText("Find your city"), {
    target: { value: "Unknown" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("No locations"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Search is unavailable",
    ),
  );
  fireEvent.click(screen.getByText("Use my location"));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Location access is unavailable",
  );
});
it("wizard exposes every profile step and generates", () => {
  const generate = vi.fn();
  wrap(<ProfileWizard busy={false} onGenerate={generate} />);
  fireEvent.change(screen.getByLabelText("Adults"), { target: { value: "3" } });
  fireEvent.click(
    screen.getByLabelText("Someone has a heart or respiratory condition"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(screen.getByLabelText("Cooking fuel"), {
    target: { value: "biomass" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Save profile on this device" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Build my daily plan" }));
  expect(generate).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  fireEvent.click(screen.getByRole("button", { name: "1. Household" }));
  fireEvent.click(screen.getByRole("button", { name: "Review & build" }));
});
it("plan scenario toggles and exports without overlapping sums", async () => {
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    }),
  );
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  vi.spyOn(window, "print").mockImplementation(() => {});
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  const { container } = wrap(<PlanView plan={fixture} />);
  expect((await axe(container)).violations).toEqual([]);
  fireEvent.click(screen.getByLabelText("Create a cleaner bedroom"));
  expect(screen.getByText(/Selected scenario/)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Create a cleaner bedroom"));
  fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));
  fireEvent.click(screen.getByRole("button", { name: "Print" }));
  fireEvent.click(screen.getByRole("button", { name: "Share / copy" }));
  await screen.findByText(
    "A link containing only action IDs was shared or copied.",
  );
  fireEvent.click(screen.getByText("Hindi", { exact: true }));
  expect(screen.getAllByText(/सोने के कमरे/).length).toBeGreaterThan(0);
});
it("community calculates scenarios and copies a notice", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  wrap(<Community />);
  fireEvent.click(screen.getByText("Seed"));
  fireEvent.change(screen.getByLabelText("Households"), {
    target: { value: "400" },
  });
  fireEvent.change(screen.getByLabelText(/Participation/), {
    target: { value: "50" },
  });
  fireEvent.change(screen.getByLabelText("Community type"), {
    target: { value: "School" },
  });
  fireEvent.click(screen.getByText("Copy notice"));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("copied"),
  );
  fireEvent.click(screen.getByText("Hindi", { exact: true }));
  expect(screen.getByText("सात दिन की साफ हवा चुनौती")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("परिवार"), {
    target: { value: "0" },
  });
  expect(screen.getByText("Enter 1–10,000 households.")).toBeInTheDocument();
});
it("learn filters evidence and recalculates purifier sizing", () => {
  wrap(<Learn />);
  fireEvent.change(screen.getByLabelText("Search guidance / सलाह खोजें"), {
    target: { value: "ozone" },
  });
  expect(screen.getByText("Avoid ozone generators")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Room area (m²)"), {
    target: { value: "10" },
  });
  expect(screen.getByText(/108–135/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Room area (m²)"), {
    target: { value: "0" },
  });
  expect(screen.getByText(/Enter a room area/)).toBeInTheDocument();
  fireEvent.click(screen.getByText("Hindi", { exact: true }));
});
it("read-aloud uses locale and supports stopping", () => {
  const speak = vi.fn(),
    cancel = vi.fn();
  vi.stubGlobal("speechSynthesis", { speak, cancel });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      lang = "";
      constructor(public text: string) {}
    },
  );
  wrap(<ReadAloud text="Hello" />);
  fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
  expect(speak).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  expect(cancel).toHaveBeenCalled();
});
it("chat consumes validated SSE and renders citation links", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          'data: {"mode":"rules"}\n\ndata: {"text":"Use filtration [kb:clean-room]"}\n\ndata: [DONE]\n\n',
          { headers: { "Content-Type": "text/event-stream" } },
        ),
      ),
  );
  wrap(<ChatPanel plan={fixture} offline={false} />);
  fireEvent.change(screen.getByLabelText("Your question"), {
    target: { value: "How to filter air?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await screen.findByRole("link", { name: "[kb:clean-room]" });
  expect(screen.getByText(/Response mode/)).toHaveTextContent("rules");
});
it("chat escalates urgent responses and handles service failure", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          'data: {"mode":"urgent"}\n\ndata: {"text":"Seek urgent care"}\n\ndata: [DONE]\n\n',
          { headers: { "Content-Type": "text/event-stream" } },
        ),
      )
      .mockRejectedValueOnce(new Error()),
  );
  wrap(<ChatPanel plan={fixture} offline={false} />);
  fireEvent.change(screen.getByLabelText("Your question"), {
    target: { value: "chest pain" },
  });
  fireEvent.click(screen.getByText("Send"));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByText("Send"));
  await screen.findByRole("alert");
  expect(screen.getByRole("alert")).toHaveTextContent(/urgent|medical/i);
});
it("workspace generates a plan and preserves it on retry failure", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          ...fixture,
          air: { ...fixture.air, source: "manual" },
        }),
      )
      .mockRejectedValueOnce(new Error()),
  );
  wrap(<PlanWorkspace />);
  fireEvent.click(screen.getByText("Seed"));
  fireEvent.click(screen.getByRole("button", { name: "Review & build" }));
  fireEvent.click(screen.getByRole("button", { name: "Build my daily plan" }));
  await screen.findByText(
    "Your rules-based plan is ready. All calculations are available.",
  );
  expect(
    screen.queryByRole("region", { name: "Plan needs updating" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Ask HAWA" }));
  expect(screen.getByLabelText("Your question")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Build my daily plan" }));
  await screen.findByText(/AI is unavailable/);
  expect(
    screen.getByRole("region", { name: "Generated plan" }),
  ).toBeInTheDocument();
});
it("forecast points have keyboard text alternatives in both languages", () => {
  const { rerender } = render(<Forecast air={fixture.air} hi={false} />);
  const point = screen.getByLabelText(/2026-11-19T11:00, 120/);
  fireEvent.focus(point);
  expect(screen.getByRole("status")).toHaveTextContent("120");
  fireEvent.blur(point);
  expect(screen.getByRole("status")).toHaveTextContent("Asia/Kolkata");
  rerender(<Forecast air={fixture.air} hi />);
  expect(screen.getByText("आगे की हवा")).toBeInTheDocument();
  rerender(<Forecast air={{ ...fixture.air, hourly: [] }} hi />);
  expect(screen.queryByRole("img")).toBeNull();
});
it("read-aloud buttons do not submit forms and announce recoverable errors", () => {
  const speak = vi.fn(),
    submit = vi.fn();
  vi.stubGlobal("speechSynthesis", {
    speak,
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      lang = "";
      constructor(public text: string) {}
    },
  );
  wrap(
    <form onSubmit={submit}>
      <ReadAloud text="Hello" />
    </form>,
  );
  expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  expect(screen.getByRole("button", { name: "Resume" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Resume" }));
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Hindi" }));
  speak.mockImplementation(() => {
    throw new Error("unavailable");
  });
  const read = screen.getByRole("button", { name: "सुनें" });
  fireEvent.click(read);
  expect(screen.getByRole("alert")).toHaveTextContent("फिर कोशिश करें");
  speak.mockImplementation(() => {});
  fireEvent.click(read);
  fireEvent.click(screen.getByRole("button", { name: "विराम दें" }));
  expect(screen.getByRole("button", { name: "जारी रखें" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
it("localizes the unavailable read-aloud state", () => {
  vi.stubGlobal("speechSynthesis", undefined);
  wrap(<ReadAloud text="Hello" />);
  fireEvent.click(screen.getByRole("button", { name: "Hindi" }));
  expect(
    screen.getByText("इस ब्राउज़र में आवाज़ में पढ़ना उपलब्ध नहीं है।"),
  ).toBeVisible();
});
it("shared kit restores only public curated steps", async () => {
  history.replaceState(null, "", shareFragment([knowledge[0]!.id], "hi"));
  wrap(<SharedKit />);
  expect(await screen.findByText("साझा साफ हवा के कदम")).toBeInTheDocument();
  history.replaceState(null, "", "#kit=%");
  fireEvent(window, new Event("hashchange"));
  await waitFor(() =>
    expect(screen.queryByText("साझा साफ हवा के कदम")).toBeNull(),
  );
  history.replaceState(null, "", "/");
});
it("fuel inputs and ceiling height update their independent calculations", () => {
  wrap(<Learn />);
  fireEvent.change(screen.getByLabelText("Fuel"), {
    target: { value: "electric" },
  });
  expect(screen.getByText(/1.454 kg/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Input energy per day (kWh)"), {
    target: { value: "-1" },
  });
  expect(screen.getByText("Enter 0–1000 kWh.")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Ceiling height (m)"), {
    target: { value: "3" },
  });
  expect(screen.getByText(/240–300/)).toBeInTheDocument();
  fireEvent.click(screen.getByText("Hindi", { exact: true }));
  expect(screen.getByText("ईंधन के प्रभाव को समझें")).toBeInTheDocument();
});
it("local chat answers without fetch and copy reports success", async () => {
  const network = vi.fn();
  vi.stubGlobal("fetch", network);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  wrap(<ChatPanel plan={fixture} offline />);
  fireEvent.click(screen.getByText("How can I reduce cooking smoke?"));
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  expect(network).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Copy answer"));
  await screen.findByText("Answer copied.");
  fireEvent.click(screen.getByText("Hindi", { exact: true }));
  expect(screen.getByText("भेजें")).toBeInTheDocument();
});
it("profile rejects missing numeric input and focuses its error summary", async () => {
  wrap(<ProfileWizard busy={false} onGenerate={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Adults"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByText("Check these values")).toBeInTheDocument();
  expect(screen.getByLabelText("Adults")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  fireEvent.change(screen.getByLabelText("Adults"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByLabelText("Cooking fuel")).toBeInTheDocument();
});

it("community copy degrades gracefully without Clipboard API support", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: undefined,
  });
  wrap(<Community />);
  fireEvent.click(screen.getByText("Copy notice"));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Clipboard unavailable",
    ),
  );
});
it("library search ignores surrounding spaces", () => {
  wrap(<Learn />);
  fireEvent.change(screen.getByLabelText("Search guidance / सलाह खोजें"), {
    target: { value: "  ozone  " },
  });
  expect(screen.getByText("Avoid ozone generators")).toBeInTheDocument();
});
it("purifier feedback identifies an invalid ceiling height", () => {
  wrap(<Learn />);
  fireEvent.change(screen.getByLabelText("Ceiling height (m)"), {
    target: { value: "1" },
  });
  expect(
    screen.getByText(/ceiling height between 2 and 6 m/),
  ).toBeInTheDocument();
});
it("child ages stay synchronized when the number of children decreases", () => {
  wrap(<ProfileWizard busy={false} onGenerate={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Children"), {
    target: { value: "2" },
  });
  fireEvent.blur(screen.getByLabelText(/Children’s ages/), {
    target: { value: "5, 8" },
  });
  expect(screen.getByLabelText(/Children’s ages/)).toHaveValue("5, 8");
  fireEvent.change(screen.getByLabelText("Children"), {
    target: { value: "1" },
  });
  expect(screen.getByLabelText(/Children’s ages/)).toHaveValue("5");
});
it("empty child-age entries are rejected instead of silently becoming newborns", () => {
  wrap(<ProfileWizard busy={false} onGenerate={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Children"), {
    target: { value: "3" },
  });
  fireEvent.blur(screen.getByLabelText(/Children’s ages/), {
    target: { value: "5,,8" },
  });
  fireEvent.click(screen.getByText("Review & build"));
  expect(screen.getByText("Check these values")).toBeInTheDocument();
});

it("profile error links open the correct step and focus the invalid field", async () => {
  wrap(<ProfileWizard busy={false} onGenerate={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Adults"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "5. Preferences" }));
  fireEvent.click(screen.getByRole("button", { name: "Build my daily plan" }));
  fireEvent.click(
    screen.getByRole("link", { name: "Adults: Enter a number from 1 to 20." }),
  );
  await waitFor(() => expect(screen.getByLabelText("Adults")).toHaveFocus());
  expect(screen.getByLabelText("Adults")).toHaveAttribute(
    "aria-describedby",
    "adults-hint adults-error",
  );
});
it("child-age errors expose one labelled correction link after leaving the household step", async () => {
  wrap(<ProfileWizard busy={false} onGenerate={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Children"), {
    target: { value: "2" },
  });
  fireEvent.blur(screen.getByLabelText(/Children’s ages/), {
    target: { value: "bad,19" },
  });
  fireEvent.click(screen.getByRole("button", { name: "5. Preferences" }));
  fireEvent.click(screen.getByRole("button", { name: "Build my daily plan" }));
  fireEvent.click(
    screen.getByRole("link", { name: /Children’s ages: Enter whole ages/ }),
  );
  await waitFor(() =>
    expect(screen.getByLabelText(/Children’s ages/)).toHaveFocus(),
  );
  expect(screen.getByLabelText(/Children’s ages/)).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});
it("empty library search recovers by clearing query and topic together", () => {
  wrap(<Learn />);
  fireEvent.change(screen.getByLabelText("Topic"), {
    target: { value: "Transport" },
  });
  fireEvent.change(screen.getByLabelText("Search guidance / सलाह खोजें"), {
    target: { value: "unknownxyz" },
  });
  expect(screen.getByText(/No guidance matches/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByLabelText("Search guidance / सलाह खोजें")).toHaveFocus();
  expect(screen.getByLabelText("Topic")).toHaveValue("all");
  expect(screen.getByText("60 guidance items")).toBeInTheDocument();
});
