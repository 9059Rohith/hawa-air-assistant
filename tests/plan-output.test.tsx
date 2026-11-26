import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Provider, useHawa } from "@/components/Provider";
import { PlanWorkspace } from "@/components/PlanWorkspace";
import { PlanView } from "@/components/PlanView";
import { Notice } from "@/components/ui";
import { Community } from "@/components/Community";
import { baseProfile, cities } from "@/data/personas";
import { localPlan } from "@/lib/rules-plan";
import type { Air } from "@/domain/types";

const air: Air = {
  pm25: 120,
  source: "manual",
  stale: false,
  hourly: [],
  observedAt: "2026-11-27T00:00:00Z",
  fetchedAt: "2026-11-27T00:00:00Z",
  timezone: "UTC",
};
const plan = localPlan(baseProfile, cities.Delhi, air);
const writeText = vi.fn();
beforeEach(() => {
  localStorage.clear();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function Controls() {
  const s = useHawa();
  return (
    <>
      <button
        onClick={() => {
          s.setLocation(cities.Delhi);
          s.setAir(air);
          s.setPlan(plan);
        }}
      >
        Seed
      </button>
      <button onClick={() => s.setProfile({ ...s.profile, adults: 4 })}>
        Change household
      </button>
      <button onClick={() => s.setAir({ ...air, pm25: 90 })}>
        Change reading
      </button>
      <button
        onClick={() => s.setLocation({ ...cities.Delhi, name: "Another city" })}
      >
        Change city
      </button>
      <button onClick={() => s.setProfile({ ...s.profile, lang: "hi" })}>
        Hindi
      </button>
    </>
  );
}
function setup(workspace = false, community = false) {
  const view = render(
    <Provider>
      <Controls />
      {workspace ? <PlanWorkspace /> : <PlanView plan={plan} />}
      {community && <Community />}
      <Notice />
    </Provider>,
  );
  fireEvent.click(screen.getByText("Seed"));
  return view;
}

it.each(["Change household", "Change reading", "Change city"])(
  "marks the previous plan outdated after %s and blocks its outputs",
  (change) => {
    setup(true);
    fireEvent.click(screen.getByText(change));
    expect(
      screen.getByRole("region", { name: "Plan needs updating" }),
    ).toBeVisible();
    for (const name of [
      "Print",
      "Download JSON",
      "Share / copy",
      "Copy summary",
    ])
      expect(screen.getByRole("button", { name })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ask HAWA" })).toBeDisabled();
  },
);
it("rebuilding through the validated wizard restores outputs for the changed household", async () => {
  setup(true);
  fireEvent.click(screen.getByText("Change household"));
  fireEvent.click(screen.getByLabelText(/Use rules mode/));
  fireEvent.click(screen.getByRole("button", { name: "Review & build" }));
  fireEvent.click(screen.getByRole("button", { name: "Build my daily plan" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("region", { name: "Plan needs updating" }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("button", { name: "Download JSON" })).toBeEnabled();
});
it("does not invalidate calculations just because the reader switches language", () => {
  setup(true);
  fireEvent.click(screen.getByText("Hindi", { exact: true }));
  expect(
    screen.queryByRole("region", { name: "योजना अपडेट करें" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "सारांश कॉपी करें" }),
  ).toBeEnabled();
});
it("does not project community savings from outdated household data", () => {
  setup(true, true);
  fireEvent.click(screen.getByText("Change household"));
  expect(
    screen.getByText(
      "Build a household plan first to calculate a community scenario.",
    ),
  ).toBeVisible();
});
it("disables invalid empty exports and restores them when an action is selected", () => {
  const { container } = setup();
  for (const checkbox of container.querySelectorAll<HTMLInputElement>(
    ".scenario-controls input",
  ))
    fireEvent.click(checkbox);
  expect(screen.getByRole("button", { name: "Download JSON" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Print" })).toBeDisabled();
  expect(screen.getByText(/Select at least one action/)).toBeVisible();
  fireEvent.click(container.querySelector(".scenario-controls input")!);
  expect(screen.getByRole("button", { name: "Download JSON" })).toBeEnabled();
});
it("copies only selected steps and retains provenance and modelling caveats", async () => {
  const { container } = setup();
  fireEvent.click(container.querySelector(".scenario-controls input")!);
  fireEvent.click(screen.getByRole("button", { name: "Copy summary" }));
  await screen.findByText(
    "Summary copied with its source and scenario limits.",
  );
  const copied = writeText.mock.calls[0]![0];
  expect(copied).toContain("User-entered PM2.5");
  expect(copied).toContain("Low-confidence scenario");
  expect(copied).not.toContain(plan.actions[0]!.title);
  expect(copied).toContain(plan.actions[1]!.title);
  expect(
    container.querySelector('li[data-included="false"]'),
  ).toHaveTextContent("Not included in the selected scenario");
});
it("opens selectable summary text when the clipboard is unavailable", async () => {
  writeText.mockRejectedValue(Error("clipboard blocked"));
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Copy summary" }));
  const text = await screen.findByLabelText("Summary with source and limits");
  await waitFor(() => expect(text.closest("details")).toHaveAttribute("open"));
  expect((text as HTMLTextAreaElement).value).toContain("not medical advice");
  expect(
    screen.getByText(/Clipboard unavailable. Select the summary text below/),
  ).toHaveAttribute("role", "status");
});
