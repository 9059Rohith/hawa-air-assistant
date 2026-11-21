import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useReadAloud } from "@/hooks/useReadAloud";

class Utterance {
  lang = "";
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}
const speech = {
  paused: false,
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
};
beforeEach(() => {
  vi.resetAllMocks();
  speech.paused = false;
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
  vi.stubGlobal("speechSynthesis", speech);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function setup() {
  const controller = new AbortController();
  const hook = renderHook(
    ({ text, lang }: { text: string; lang: "en" | "hi" }) =>
      useReadAloud(text, lang, controller.signal),
    { initialProps: { text: "Clean air", lang: "en" } },
  );
  const start = () => {
    act(() => hook.result.current.start());
    return speech.speak.mock.lastCall![0] as Utterance;
  };
  return { ...hook, controller, start };
}
it("starts, pauses, resumes and stops one utterance", () => {
  const h = setup();
  expect(h.result.current.available).toBe(true);
  act(() => h.result.current.togglePause());
  expect(speech.pause).not.toHaveBeenCalled();
  const utterance = h.start();
  expect(utterance.text).toBe("Clean air");
  expect(utterance.lang).toBe("en-IN");
  act(() => h.result.current.togglePause());
  expect(h.result.current.status).toBe("paused");
  expect(speech.pause).toHaveBeenCalledOnce();
  act(() => h.result.current.togglePause());
  expect(speech.resume).toHaveBeenCalledOnce();
  act(() => h.result.current.stop());
  expect(h.result.current.status).toBe("idle");
  expect(utterance.onend).toBeNull();
  expect(speech.cancel).toHaveBeenCalledOnce();
});
it.each(["onend", "onerror"] as const)(
  "settles %s and permits retry",
  (event) => {
    const h = setup();
    const utterance = h.start();
    act(() => utterance[event]?.());
    expect(h.result.current.status).toBe("idle");
    expect(h.result.current.failed).toBe(event === "onerror");
    h.start();
    expect(h.result.current.status).toBe("speaking");
    expect(h.result.current.failed).toBe(false);
  },
);
it("ignores queued callbacks from superseded speech", () => {
  const h = setup();
  const first = h.start();
  const end = first.onend,
    error = first.onerror;
  h.start();
  act(() => {
    end?.();
    error?.();
  });
  expect(h.result.current.status).toBe("speaking");
  expect(h.result.current.failed).toBe(false);
});
it.each([false, true])(
  "resumes the native engine when restarting paused speech (stop first: %s)",
  (stopFirst) => {
    const h = setup();
    h.start();
    act(() => h.result.current.togglePause());
    speech.paused = true;
    if (stopFirst) act(() => h.result.current.stop());
    speech.resume.mockImplementationOnce(() => {
      speech.paused = false;
    });
    h.start();
    expect(speech.resume).toHaveBeenCalledOnce();
    expect(speech.paused).toBe(false);
    expect(h.result.current.status).toBe("speaking");
  },
);
it("cancels on content and language changes and uses the new language", () => {
  const h = setup();
  h.start();
  h.rerender({ text: "नमस्ते", lang: "hi" });
  expect(h.result.current.status).toBe("idle");
  expect(speech.cancel).toHaveBeenCalledOnce();
  expect(h.start().lang).toBe("hi-IN");
});
it("clear-data abort cancels speech even when text does not change", () => {
  const h = setup();
  h.start();
  act(() => h.controller.abort());
  expect(speech.cancel).toHaveBeenCalledOnce();
  expect(h.result.current.status).toBe("idle");
});
it("cannot restart playback with a cleared session signal", () => {
  const h = setup();
  act(() => h.controller.abort());
  act(() => h.result.current.start());
  expect(speech.speak).not.toHaveBeenCalled();
});
it("unmount detaches callbacks and cancels owned speech", () => {
  const h = setup(),
    utterance = h.start();
  h.unmount();
  expect(utterance.onend).toBeNull();
  expect(utterance.onerror).toBeNull();
  expect(speech.cancel).toHaveBeenCalledOnce();
});
it.each(["speak", "pause", "resume", "cancel"] as const)(
  "recovers from a browser %s exception",
  (method) => {
    const h = setup();
    if (method !== "speak") h.start();
    if (method === "resume") act(() => h.result.current.togglePause());
    speech[method].mockImplementationOnce(() => {
      throw new Error("Unavailable");
    });
    act(() => {
      if (method === "speak") h.result.current.start();
      else if (method === "cancel") h.result.current.stop();
      else h.result.current.togglePause();
    });
    expect(h.result.current.failed).toBe(true);
    expect(h.result.current.status).toBe("idle");
    h.start();
    expect(h.result.current.failed).toBe(false);
  },
);
it("keeps unmount safe when native cancellation throws", () => {
  const h = setup();
  h.start();
  speech.cancel.mockImplementationOnce(() => {
    throw new Error("Unavailable");
  });
  expect(() => h.unmount()).not.toThrow();
});
it.each(["SpeechSynthesisUtterance", "speechSynthesis"])(
  "reports unavailable when %s is missing",
  (name) => {
    vi.stubGlobal(name, undefined);
    expect(setup().result.current.available).toBe(false);
  },
);
