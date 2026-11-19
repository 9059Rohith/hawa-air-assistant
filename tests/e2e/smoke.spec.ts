import { test, expect } from "@playwright/test";
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
