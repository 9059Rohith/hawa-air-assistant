import { test, expect, type Page } from "@playwright/test";

test("manual recovery remains available during a stalled city search", async ({
  page,
}) => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/geocode?*", async (route) => {
    await waiting;
    await route
      .fulfill({ json: [{ name: "Delhi", lat: 28.61, lon: 77.21 }] })
      .catch(() => undefined);
  });
  await page.goto("/");
  await page.getByRole("combobox", { name: "Find your city" }).fill("Delhi");
  await expect(
    page.getByRole("button", { name: "Stop request" }),
  ).toBeVisible();
  await page.getByLabel(/Have a PM2.5/).fill("150");
  await page.getByRole("button", { name: "Use reading", exact: true }).click();
  release();
  await expect(page.getByText(/Your manual reading/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Search", exact: true }),
  ).toBeEnabled();
  await expect(page.locator('#city-results [role="option"]')).toHaveCount(0);
});

test("clear data resets an active city lookup and permits another search", async ({
  page,
}) => {
  await page.route("**/api/geocode?*", async (route) => {
    await route.fulfill({ json: [{ name: "Delhi", lat: 28.61, lon: 77.21 }] });
  });
  await page.goto("/");
  const city = page.getByRole("combobox", { name: "Find your city" });
  await city.fill("Delhi");
  await expect(page.locator('#city-results [role="option"]')).toHaveCount(1);
  await page.getByLabel(/Have a PM2.5/).fill("150");
  await page
    .getByRole("button", { name: "Clear my data", exact: true })
    .click();
  await expect(city).toHaveValue("");
  await expect(page.getByLabel(/Have a PM2.5/)).toHaveValue("");
  await expect(page.locator('#city-results [role="option"]')).toHaveCount(0);
  await city.fill("Delhi");
  await expect(page.locator('#city-results [role="option"]')).toHaveCount(1);
});

async function prepare(page: Page) {
  await page.goto("/");
  await page.getByLabel(/Have a PM2.5/).fill("120");
  await page.getByRole("button", { name: "Use reading", exact: true }).click();
  await expect(page.getByText(/Your manual reading/)).toBeVisible();
  await page.getByRole("link", { name: /Build my daily plan/ }).click();
  await page.getByRole("button", { name: "Review & build" }).click();
}
async function buildLocal(page: Page) {
  await prepare(page);
  await page.getByLabel(/Use rules mode/).check();
  await page
    .getByRole("button", { name: "Build my daily plan", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Generated plan" }),
  ).toBeVisible();
}

test("sharing excludes empty selections and rejects extra private fields", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async ({ url }: { url: string }) => {
        sessionStorage.setItem("test-shared-url", url);
      },
    });
  });
  await buildLocal(page);
  const scenario = page.locator(".plan-results details.panel").first();
  await scenario.locator("summary").click();
  const selections = scenario.getByRole("checkbox");
  for (const selection of await selections.all()) await selection.uncheck();
  await expect(
    page.getByRole("button", { name: "Share / copy", exact: true }),
  ).toBeDisabled();
  await selections.first().check();
  await page.getByRole("button", { name: "Share / copy", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("test-shared-url")))
    .not.toBeNull();
  const shared = await page.evaluate(() =>
    sessionStorage.getItem("test-shared-url")!,
  );
  const payload = JSON.parse(decodeURIComponent(new URL(shared).hash.slice(5)));
  expect(Object.keys(payload).sort()).toEqual(["ids", "lang", "v"]);
  expect(payload.ids).toHaveLength(1);
  await page.goto(shared);
  await expect(
    page.getByRole("heading", { name: "Shared clean-air steps" }),
  ).toBeVisible();
  await page.goto(
    `/community#kit=${encodeURIComponent(JSON.stringify({ ...payload, profile: { location: "private address" } }))}`,
  );
  await expect(
    page.getByRole("heading", { name: "Shared clean-air steps" }),
  ).toHaveCount(0);
  await expect(page.getByText("private address")).toHaveCount(0);
});

test("read-aloud controls settle on completion, error and clear-data", async ({
  page,
}) => {
  await page.addInitScript(() => {
    class Voice {
      lang = "";
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    }
    let current: Voice | undefined;
    let paused = false;
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: Voice,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        get paused() {
          return paused;
        },
        speak: (utterance: Voice) => {
          if (paused) throw new Error("Engine is still paused");
          current = utterance;
        },
        cancel: () => {
          current = undefined;
        },
        pause: () => {
          paused = true;
        },
        resume: () => {
          paused = false;
        },
      },
    });
    window.addEventListener("test-speech-end", () => current?.onend?.());
    window.addEventListener("test-speech-error", () => current?.onerror?.());
  });
  await page.goto("/community");
  const read = page.getByRole("button", { name: "Read aloud", exact: true });
  const pause = page.getByRole("button", { name: "Pause", exact: true });
  const stop = page.getByRole("button", { name: "Stop", exact: true });
  await expect(pause).toBeDisabled();
  await read.click();
  await pause.click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await pause.click();
  await stop.click();
  await read.click();
  await expect(stop).toBeEnabled();
  await page.evaluate(() => window.dispatchEvent(new Event("test-speech-end")));
  await expect(stop).toBeDisabled();
  await read.click();
  await page.evaluate(() =>
    window.dispatchEvent(new Event("test-speech-error")),
  );
  const speechAlert = page
    .getByRole("alert")
    .filter({ hasText: "Read-aloud is unavailable right now" });
  await expect(speechAlert).toBeVisible();
  await read.click();
  await expect(speechAlert).toHaveCount(0);
  await page
    .getByRole("button", { name: "Clear my data", exact: true })
    .click();
  await expect(stop).toBeDisabled();
});
test("specific chat questions keep citations focused in English and Hindi", async ({
  page,
}) => {
  let networkCalls = 0;
  await page.route("**/api/chat", (route) => {
    networkCalls++;
    return route.abort();
  });
  await buildLocal(page);
  await page.getByRole("button", { name: "Ask HAWA", exact: true }).click();
  await page.getByLabel("Your question").fill("How should a mask fit?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".reply a")).toHaveCount(1);
  await expect(page.locator(".reply a")).toHaveAttribute(
    "href",
    "/learn#mask-fit",
  );
  await page.getByRole("button", { name: "हिन्दी", exact: true }).click();
  await page.getByLabel("आपका सवाल").fill("मास्क फिट");
  await page.getByRole("button", { name: "भेजें", exact: true }).click();
  await expect(page.locator(".reply a")).toHaveCount(1);
  await expect(page.locator(".reply a")).toHaveAttribute(
    "href",
    "/learn#mask-fit",
  );
  expect(networkCalls).toBe(0);
});

test("chat does not mistake car for carbon and recovers from an unknown question", async ({
  page,
}) => {
  await buildLocal(page);
  await page.getByRole("button", { name: "Ask HAWA", exact: true }).click();
  await page.getByLabel("Your question").fill("car");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".reply a").first()).toHaveAttribute(
    "href",
    "/learn#carpool",
  );
  await expect(page.locator('.reply a[href="/learn#co-alarm"]')).toHaveCount(0);
  await page.getByLabel("Your question").fill("quantum cryptocurrency");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".reply")).toContainText(
    "not have enough grounded information",
  );
  await expect(page.locator(".reply a")).toHaveCount(0);
  await page.getByLabel("Your question").fill("CO alarms");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".reply a").first()).toHaveAttribute(
    "href",
    "/learn#co-alarm",
  );
});
test("switching to rules mode releases a pending plan request", async ({
  page,
}) => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/plan", async (route) => {
    await waiting;
    await route
      .fulfill({ status: 503, body: "unavailable" })
      .catch(() => undefined);
  });
  await prepare(page);
  const generate = page.locator('.wizard button[type="submit"]');
  const requested = page.waitForRequest("**/api/plan");
  await generate.click();
  await requested;
  await expect(generate).toBeDisabled();
  await page.getByLabel(/Use rules mode/).check();
  await expect(generate).toBeEnabled();
  await generate.click();
  release();
  await expect(
    page.getByRole("region", { name: "Generated plan" }),
  ).toBeVisible();
  await expect(page.locator(".notice")).toContainText(
    "No network request was needed",
  );
});

test("switching to rules mode releases chat and supports an immediate local answer", async ({
  page,
}) => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/chat", async (route) => {
    await waiting;
    await route
      .fulfill({ status: 503, body: "unavailable" })
      .catch(() => undefined);
  });
  await buildLocal(page);
  await page.getByLabel(/Use rules mode/).uncheck();
  await page.getByRole("button", { name: "Ask HAWA", exact: true }).click();
  await page.getByLabel("Your question").fill("mask fitting");
  const requested = page.waitForRequest("**/api/chat");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await requested;
  await page.getByLabel(/Use rules mode/).check();
  await expect(
    page.getByRole("button", { name: "Send", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  release();
  await expect(
    page.getByText("Response mode: rules", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".reply a").first()).toBeVisible();
});

test("contradictory chat provenance falls back to cited guidance", async ({
  page,
}) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: 'data: {"mode":"llm"}\n\ndata: {"text":"Contradictory remote answer"}\n\ndata: {"mode":"rules"}\n\ndata: [DONE]\n\n',
    }),
  );
  await buildLocal(page);
  await page.getByLabel(/Use rules mode/).uncheck();
  await page.getByRole("button", { name: "Ask HAWA", exact: true }).click();
  await page.getByLabel("Your question").fill("mask fitting");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Response mode: rules", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".reply")).not.toContainText(
    "Contradictory remote answer",
  );
  await expect(page.locator(".reply a").first()).toBeVisible();
});
test("invalid household input focuses a useful error and can be corrected", async ({
  page,
}) => {
  await page.goto("/plan");
  await page.locator("#adults").fill("0");
  await page.getByRole("button", { name: "Review & build" }).click();
  await expect(
    page.getByRole("heading", { name: "Check these values" }),
  ).toBeVisible();
  await expect(page.locator(".wizard .warning")).toBeFocused();
  await expect(page.locator("#adults")).toHaveAttribute("aria-invalid", "true");
  await page.locator("#adults").fill("2");
  await page.getByRole("button", { name: "Review & build" }).click();
  await expect(
    page.getByRole("button", { name: "Build my daily plan", exact: true }),
  ).toBeVisible();
});
test("theme and language persist across reload; clear removes household preferences", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Theme", { exact: true }).selectOption("hc");
  await page.getByRole("button", { name: "हिन्दी", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "hc");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page
    .getByRole("button", { name: "Clear my data", exact: true })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("hawa-profile-v1")),
  ).toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem("hawa-language")),
  ).toBeNull();
  await expect(page.getByRole("status")).toContainText("cleared");
});
test("storage denied still supports manual local planning", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await buildLocal(page);
  await page
    .getByRole("button", { name: "Save profile on this device" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Storage is unavailable",
  );
  await expect(
    page.getByRole("region", { name: "Generated plan" }),
  ).toBeVisible();
});
test("public shared steps contain only action IDs and reject unknown kits", async ({
  page,
}) => {
  const kit = { v: 1, lang: "en", ids: ["mask-fit"] };
  await page.goto("/community#kit=" + encodeURIComponent(JSON.stringify(kit)));
  await expect(
    page.getByRole("heading", { name: "Shared clean-air steps" }),
  ).toBeVisible();
  await expect(
    page.getByText("This link contains no household details.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.evaluate(() => {
    location.hash =
      "kit=" +
      encodeURIComponent(
        JSON.stringify({ v: 1, lang: "en", ids: ["fake-cure"] }),
      );
  });
  await expect(
    page.getByRole("heading", { name: "Shared clean-air steps" }),
  ).toHaveCount(0);
});
test("download exports the selected actions and matching impact", async ({
  page,
}) => {
  await buildLocal(page);
  const selectedBefore = await page.locator(".action-list > li").count();
  await page.getByText("What if you made these changes?").click();
  await page.locator(".plan-results details.panel input").first().uncheck();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const parts: Buffer[] = [];
  for await (const part of stream!) parts.push(part);
  const exported = JSON.parse(Buffer.concat(parts).toString());
  expect(exported.actions).toHaveLength(selectedBefore - 1);
  expect(exported.impact.selected.sort()).toEqual(
    exported.actions.map((a: { id: string }) => a.id).sort(),
  );
  expect(exported.air.source).toBe("manual");
  expect(exported.generatedBy).toBe("rules");
  expect(exported.impact.after).toBeLessThanOrEqual(exported.impact.baseline);
});
test("provider failure produces a usable local plan with honest provenance", async ({
  page,
}) => {
  await page.route("**/api/plan", (r) =>
    r.fulfill({ status: 503, body: "Unavailable" }),
  );
  await prepare(page);
  await page
    .getByRole("button", { name: "Build my daily plan", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Generated plan" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("AI is unavailable");
  await expect(page.locator(".mode")).toContainText("Rules-based guidance");
});
test("malformed successful API data falls back without a runtime crash", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/plan", (r) =>
    r.fulfill({ json: { generatedBy: "llm", actions: null } }),
  );
  await prepare(page);
  await page
    .getByRole("button", { name: "Build my daily plan", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Generated plan" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("AI is unavailable");
  expect(errors).toEqual([]);
});
test("keyboard skip and city Escape return control without selecting stale results", async ({
  page,
}) => {
  await page.route("**/api/geocode?*", (r) =>
    r.fulfill({ json: [{ name: "Delhi", lat: 28.61, lon: 77.21 }] }),
  );
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  const city = page.getByRole("combobox", { name: "Find your city" });
  await city.fill("Delhi");
  await expect(
    page.getByRole("option", { name: "1. Delhi", exact: true }),
  ).toBeVisible();
  await city.press("ArrowDown");
  await city.press("Escape");
  await expect(city).toHaveAttribute("aria-expanded", "false");
  await expect(city).not.toHaveAttribute("aria-activedescendant");
  await expect(city).toBeFocused();
});
