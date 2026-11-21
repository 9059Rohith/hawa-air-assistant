import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Provider, useHawa } from "@/components/Provider";
import { LocationForm } from "@/components/LocationForm";
import { loadBrowserAir } from "@/lib/browser-air";
import { cities } from "@/data/personas";
import type { Air } from "@/domain/types";

vi.mock("@/lib/browser-air", () => ({ loadBrowserAir: vi.fn() }));
const reading: Air = {
  pm25: 80,
  hourly: [],
  source: "open-meteo-browser",
  stale: false,
  timezone: "UTC",
  fetchedAt: new Date().toISOString(),
  observedAt: new Date().toISOString(),
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function State() {
  const { air, location, notice, clear } = useHawa();
  return (
    <>
      <button onClick={clear}>Clear</button>
      <output data-testid="state">
        {JSON.stringify({ air, location, notice })}
      </output>
    </>
  );
}
function setup() {
  return render(
    <Provider>
      <LocationForm />
      <State />
    </Provider>,
  );
}
function search() {
  fireEvent.change(screen.getByLabelText("Find your city"), {
    target: { value: "Delhi" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
}
function manual() {
  fireEvent.change(screen.getByLabelText(/Have a PM2.5/), {
    target: { value: "150" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Use reading" }));
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.mocked(loadBrowserAir).mockReset();
});

it.each(["Clear", "Stop request", "manual", "Escape"])(
  "%s prevents a delayed city search from restoring results",
  async (action) => {
    const pending = deferred<Response>();
    const fetcher = vi.fn().mockReturnValue(pending.promise);
    vi.stubGlobal("fetch", fetcher);
    setup();
    search();
    await waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
    if (action === "manual") manual();
    else if (action === "Escape")
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    else fireEvent.click(screen.getByRole("button", { name: action }));
    await act(async () => {
      pending.resolve(Response.json([cities.Delhi]));
    });
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
    if (action === "Clear")
      expect(screen.getByTestId("state")).toHaveTextContent('"location":null');
    if (action === "manual")
      expect(screen.getByTestId("state")).toHaveTextContent(
        '"source":"manual"',
      );
  },
);
it.each(["Clear", "Stop request", "manual", "unmount"])(
  "%s prevents a delayed air response from publishing",
  async (action) => {
    const pending = deferred<Air>();
    vi.mocked(loadBrowserAir).mockReturnValue(pending.promise);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json([cities.Delhi])),
    );
    const view = setup();
    search();
    fireEvent.click(await screen.findByRole("option"));
    await waitFor(() => expect(loadBrowserAir).toHaveBeenCalledOnce());
    if (action === "manual") manual();
    else if (action === "unmount")
      view.rerender(
        <Provider>
          <State />
        </Provider>,
      );
    else fireEvent.click(screen.getByRole("button", { name: action }));
    await act(async () => {
      pending.resolve(reading);
    });
    expect(screen.getByTestId("state")).not.toHaveTextContent(
      '"source":"open-meteo-browser"',
    );
    if (action === "manual")
      expect(screen.getByTestId("state")).toHaveTextContent('"pm25":150');
    if (action === "Clear")
      expect(screen.getByTestId("state")).toHaveTextContent('"location":null');
  },
);
it.each(["success", "failure"])(
  "ignores geolocation %s after clearing data",
  async (outcome) => {
    let success!: PositionCallback, failure!: PositionErrorCallback;
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (
          yes: PositionCallback,
          no: PositionErrorCallback,
        ) => {
          success = yes;
          failure = no;
        },
      },
    });
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await act(async () => {
      if (outcome === "success")
        success({
          coords: { latitude: 28.61, longitude: 77.21 },
        } as GeolocationPosition);
      else failure({ code: 1 } as GeolocationPositionError);
    });
    expect(loadBrowserAir).not.toHaveBeenCalled();
    expect(screen.getByTestId("state")).toHaveTextContent('"location":null');
    expect(screen.getByTestId("state")).toHaveTextContent("cleared");
  },
);
it("retains manual recovery when an obsolete air request rejects", async () => {
  const pending = deferred<Air>();
  vi.mocked(loadBrowserAir).mockReturnValue(pending.promise);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json([cities.Delhi])),
  );
  setup();
  search();
  fireEvent.click(await screen.findByRole("option"));
  await waitFor(() => expect(loadBrowserAir).toHaveBeenCalledOnce());
  manual();
  await act(async () => {
    pending.reject(new Error("offline"));
  });
  expect(screen.getByTestId("state")).toHaveTextContent(
    "Using your manual reading",
  );
});
