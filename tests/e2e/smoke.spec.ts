import { test, expect } from "@playwright/test";
test("browser air forecast reaches a plan without a second provider request", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/geocode?*", (route) =>
    route.fulfill({ json: [{ name: "Delhi", lat: 28.61, lon: 77.21 }] }),
  );
  await page.route("https://air-quality-api.open-meteo.com/**", (route) => {
    requests++;
    return route.fulfill({
      json: {
        current: { pm2_5: 91, time: "2026-11-19T18:00" },
        hourly: {
          time: ["2026-11-19T18:00", "2026-11-19T19:00", "2026-11-19T20:00"],
          pm2_5: [91, 89, 85],
        },
        timezone: "Asia/Kolkata",
      },
    });
  });
  const document = await page.goto("/", { waitUntil: "networkidle" });
  expect(document?.headers()["content-security-policy"]).toContain(
    "connect-src 'self' https://air-quality-api.open-meteo.com;",
  );
  await page.getByLabel("Find your city").fill("Delhi");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("option", { name: "1. Delhi", exact: true }).click();
  await expect(page.getByText(/not independently verified/)).toBeVisible();
  await page.getByRole("link", { name: /Build my daily plan/ }).click();
  await page.getByRole("button", { name: "Review & build" }).click();
  await page.getByLabel(/Use rules mode/).check();
  let planRequests = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/plan")) planRequests++;
  });
  await page
    .getByRole("button", { name: "Build my daily plan", exact: true })
    .click();
  expect(planRequests).toBe(0);
  await expect(
    page.getByRole("region", { name: "Generated plan" }),
  ).toBeVisible();
  expect(requests).toBe(1);
});
test("provider rate limits preserve manual recovery without fake live data", async ({
  page,
}) => {
  await page.route("**/api/geocode?*", (route) =>
    route.fulfill({ json: [{ name: "Delhi", lat: 28.61, lon: 77.21 }] }),
  );
  await page.route("https://air-quality-api.open-meteo.com/**", (route) =>
    route.fulfill({
      status: 429,
      headers: { "Retry-After": "120" },
      body: "Rate limited",
    }),
  );
  await page.goto("/");
  await page.getByLabel("Find your city").fill("Delhi");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("option", { name: "1. Delhi", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Live data is unavailable",
  );
  await expect(page.getByText(/Model timestamp/)).toHaveCount(0);
  await page.getByLabel(/Have a PM2.5/).fill("100");
  await page.getByRole("button", { name: "Use reading" }).click();
  await expect(page.getByText(/Your manual reading/)).toBeVisible();
});
test("manual data → profile → rules plan → what-if → chat → Hindi", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel(/Have a PM2.5/).fill("150");
  await page.getByRole("button", { name: "Use reading" }).click();
  await expect(page.getByText(/Your manual reading/)).toBeVisible();
  await page.getByRole("link", { name: /Build my daily plan/ }).click();
  await page.getByRole("button", { name: "Review & build" }).click();
  await page.getByLabel(/Use rules mode/).check();
  await page.getByRole("button", { name: "Build my daily plan" }).click();
  await expect(
    page.getByRole("region", { name: "Generated plan" }),
  ).toBeVisible();
  expect(
    await page.locator(".action-list > li").count(),
  ).toBeGreaterThanOrEqual(6);
  await page.getByText("What if you made these changes?").click();
  await page.locator(".plan-results details.panel input").first().uncheck();
  await expect(page.getByText(/Selected scenario/)).toBeVisible();
  await page.getByRole("button", { name: "Ask HAWA" }).click();
  await page
    .getByLabel("Your question")
    .fill("How do I use my kitchen exhaust?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".reply a").first()).toBeVisible();
  await page.getByRole("button", { name: "हिन्दी" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  expect(errors).toEqual([]);
});
test("all routes reflow and expose navigation", async ({ page }) => {
  for (const route of ["/", "/plan", "/community", "/learn", "/about"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeVisible();
  }
});
test("community and purifier calculations respond to inputs", async ({
  page,
}) => {
  await page.goto("/community");
  await page.getByLabel("Households").fill("400");
  await page.getByRole("button", { name: "Copy notice" }).click();
  await expect(page.locator(".week-list li")).toHaveCount(7);
  await page.goto("/learn");
  await page.getByLabel("Room area (m²)").fill("10");
  await expect(page.getByText(/108–135/)).toBeVisible();
  await page.getByLabel("Search guidance / सलाह खोजें").fill("plants");
  await expect(page.getByText("Keep plants for enjoyment")).toBeVisible();
});
test("keyboard city selection and loaded-page offline planning at 320px", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route("**/api/geocode?*", (route) =>
    route.fulfill({ json: [{ name: "Delhi", lat: 28.61, lon: 77.21 }] }),
  );
  await page.route("https://air-quality-api.open-meteo.com/**", (route) =>
    route.fulfill({ status: 429, body: "Rate limited" }),
  );
  await page.goto("/");
  const city = page.getByRole("combobox", { name: "Find your city" });
  await city.fill("Delhi");
  await expect(page.getByRole("option", { name: "1. Delhi" })).toBeVisible();
  await city.press("ArrowDown");
  await expect(city).toHaveAttribute("aria-activedescendant", "city-option-0");
  await city.press("Enter");
  await expect(page.getByRole("status")).toContainText(
    "Live data is unavailable",
  );
  await page.getByLabel(/Have a PM2.5/).fill("120");
  await page.getByRole("button", { name: "Use reading" }).click();
  await page.getByRole("link", { name: /Build my daily plan/ }).click();
  await page.getByRole("button", { name: "Review & build" }).click();
  await context.setOffline(true);
  await page
    .getByRole("button", { name: "Build my daily plan", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Generated plan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ask HAWA" }).click();
  await page
    .getByLabel("Your question")
    .fill("How can I reduce cooking smoke?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".reply a").first()).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  expect((await download).suggestedFilename()).toBe("hawa-plan.json");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await context.setOffline(false);
});
test("home route stays inside the 130 KiB compressed JavaScript budget", async ({
  page,
  request,
}) => {
  const { gzipSync } = await import("node:zlib");
  await page.goto("/");
  const scripts = await page
    .locator('script[src^="/_next/"]:not([nomodule])')
    .evaluateAll(
      (nodes) =>
        [...new Set(nodes.map((n) => n.getAttribute("src")))].filter(
          Boolean,
        ) as string[],
    );
  expect(scripts.length).toBeGreaterThan(0);
  let total = 0;
  for (const src of scripts) {
    const response = await request.get(src);
    expect(response.ok()).toBe(true);
    total += gzipSync(await response.body()).length;
  }
  expect(total).toBeLessThanOrEqual(133120);
});
