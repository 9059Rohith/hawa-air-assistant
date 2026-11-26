import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import { Provider, useHawa } from "@/components/Provider";
import { PlanWorkspace } from "@/components/PlanWorkspace";
import { baseProfile, cities } from "@/data/personas";
import { localPlan } from "@/lib/rules-plan";
import { manualAir } from "@/services/air";
import type { Plan } from "@/domain/types";
vi.mock("@/components/ProfileWizard", () => ({
  ProfileWizard: ({
    onGenerate,
    busy,
  }: {
    onGenerate: () => void;
    busy: boolean;
  }) => (
    <button disabled={busy} onClick={onGenerate}>
      Generate
    </button>
  ),
}));
vi.mock("@/components/LocationForm", () => ({
  LocationForm: () => <p>Choose a reading</p>,
}));
vi.mock("@/components/PlanView", () => ({
  PlanView: ({ plan }: { plan: Plan }) => <p>{plan.headline}</p>,
}));
const air = manualAir(120);
const plan = localPlan(baseProfile, cities.Delhi, air);
function Controls() {
  const s = useHawa();
  return (
    <>
      <button
        onClick={() => {
          s.setLocation(cities.Delhi);
          s.setAir(air);
        }}
      >
        Seed
      </button>
      <button onClick={s.clear}>Clear</button>
      <button onClick={() => s.setAir({ ...air, source: "open-meteo" })}>
        Use live reading
      </button>
      <button onClick={() => s.setProfile({ ...s.profile, budget: "free" })}>
        Change budget
      </button>
      <p role="status">{s.notice}</p>
      <p data-testid="current">{s.plan?.headline ?? "No plan"}</p>
    </>
  );
}
function setup() {
  const view = render(
    <Provider>
      <Controls />
      <PlanWorkspace />
    </Provider>,
  );
  fireEvent.click(screen.getByText("Seed"));
  return view;
}

it("accepts a refreshed provider snapshot without immediately invalidating its plan", async () => {
  const refreshed = {
    ...plan,
    air: { ...air, source: "open-meteo" as const, pm25: 75 },
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(refreshed)),
  );
  setup();
  fireEvent.click(screen.getByText("Use live reading"));
  fireEvent.click(screen.getByText("Generate"));
  await waitFor(() =>
    expect(screen.getByTestId("current")).toHaveTextContent(refreshed.headline),
  );
  expect(
    screen.queryByRole("region", { name: "Plan needs updating" }),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Ask HAWA" })).toBeEnabled();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});
it("ignores a late successful response after the user clears their data", async () => {
  let resolve!: (r: Response) => void;
  const fetcher = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
    () =>
      new Promise<Response>((r) => {
        resolve = r;
      }),
  );
  vi.stubGlobal("fetch", fetcher);
  setup();
  fireEvent.click(screen.getByText("Generate"));
  fireEvent.click(screen.getByText("Clear"));
  expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  await act(async () => {
    resolve(Response.json(plan));
  });
  expect(screen.getByTestId("current")).toHaveTextContent("No plan");
  expect(screen.getByText("Choose a reading")).toBeVisible();
});
it("clears in-memory data even when removing saved storage throws", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(plan)),
  );
  setup();
  fireEvent.click(screen.getByText("Generate"));
  await waitFor(() =>
    expect(screen.getByTestId("current")).toHaveTextContent(plan.headline),
  );
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  fireEvent.click(screen.getByText("Clear"));
  expect(screen.getByTestId("current")).toHaveTextContent("No plan");
  expect(screen.getByRole("status")).toHaveTextContent("Storage is blocked");
});
it("ignores a late failure after household preferences change", async () => {
  let reject!: (e: Error) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise((_resolve, r) => {
          reject = r;
        }),
    ),
  );
  setup();
  fireEvent.click(screen.getByText("Generate"));
  fireEvent.click(screen.getByText("Change budget"));
  await act(async () => {
    reject(new Error("late network failure"));
  });
  expect(screen.getByTestId("current")).toHaveTextContent("No plan");
  expect(screen.getByText("Generate")).toBeEnabled();
});
it("aborts the network when the workspace unmounts", () => {
  const fetcher = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
    () => new Promise<Response>(() => {}),
  );
  vi.stubGlobal("fetch", fetcher);
  const view = setup();
  fireEvent.click(screen.getByText("Generate"));
  view.unmount();
  expect(fetcher.mock.calls[0]?.[1].signal?.aborted).toBe(true);
});
it.each([
  null,
  { actions: null },
  { ...plan, impact: { ...plan.impact, percent: 101 } },
  { ...plan, generatedBy: "fabricated" },
])("malformed success uses local fallback: %#", async (payload) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(payload)),
  );
  setup();
  fireEvent.click(screen.getByText("Generate"));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("AI is unavailable"),
  );
  expect(screen.getByTestId("current")).toHaveTextContent(
    "Your smog game plan",
  );
});
it("local mode generates without calling any API", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  setup();
  fireEvent.click(screen.getByLabelText(/Use rules mode/));
  fireEvent.click(screen.getByText("Generate"));
  await waitFor(() =>
    expect(screen.getByTestId("current")).toHaveTextContent(plan.headline),
  );
  expect(fetcher).not.toHaveBeenCalled();
});
it.each(["success", "failure"])(
  "rules-mode selection cancels an online plan and ignores late %s",
  async (outcome) => {
    let resolve!: (response: Response) => void, reject!: (error: Error) => void;
    const network = vi.fn<
      (url: string, init: RequestInit) => Promise<Response>
    >(
      () =>
        new Promise((yes, no) => {
          resolve = yes;
          reject = no;
        }),
    );
    vi.stubGlobal("fetch", network);
    setup();
    fireEvent.click(screen.getByText("Generate"));
    fireEvent.click(screen.getByLabelText(/Use rules mode/));
    expect(network.mock.calls[0]?.[1].signal?.aborted).toBe(true);
    expect(screen.getByText("Generate")).toBeEnabled();
    fireEvent.click(screen.getByText("Generate"));
    await act(async () => {
      if (outcome === "success")
        resolve(
          Response.json({
            ...plan,
            headline: "Obsolete AI plan",
            generatedBy: "llm",
          }),
        );
      else reject(new Error("Late failure"));
    });
    expect(screen.getByTestId("current")).toHaveTextContent(plan.headline);
    expect(screen.getByTestId("current")).not.toHaveTextContent(
      "Obsolete AI plan",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No network request was needed",
    );
    expect(network).toHaveBeenCalledOnce();
  },
);
