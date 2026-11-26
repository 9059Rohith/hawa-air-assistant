import React from "react";
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

const delayed = vi.hoisted(() => {
  let finish!: () => void;
  const ready = new Promise<void>((resolve) => {
    finish = resolve;
  });
  return { ready, finish, read: vi.fn() };
});
vi.mock("@/lib/profile", async (original) => {
  await delayed.ready;
  const profileModule = await original<typeof import("@/lib/profile")>();
  return {
    readProfile: (...args: Parameters<typeof profileModule.readProfile>) => {
      delayed.read();
      return profileModule.readProfile(...args);
    },
  };
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});
function Controls() {
  const state = useHawa();
  return (
    <>
      <button onClick={state.clear}>Clear</button>
      <p role="status">{state.notice}</p>
    </>
  );
}
it("a delayed corrupt restore cannot overwrite the Clear result", async () => {
  localStorage.setItem("hawa-profile-v1", "broken");
  render(
    <Provider>
      <Controls />
    </Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  await act(async () => {
    delayed.finish();
    await delayed.ready;
  });
  await waitFor(() => expect(delayed.read).toHaveBeenCalledOnce());
  expect(screen.getByRole("status")).toHaveTextContent(
    "Local profile and current plan cleared.",
  );
  expect(localStorage.getItem("hawa-profile-v1")).toBeNull();
});
