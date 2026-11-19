import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const demoDir = process.env.DEMO_DIRECTORY ?? "artifacts/demo";
const origin = process.env.DEMO_ORIGIN ?? "http://localhost:3100";
mkdirSync(demoDir, { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: demoDir, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
const captions = [];
const start = Date.now();
async function scene(text, action, seconds = 10) {
  await action();
  captions.push({ start: (Date.now() - start) / 1000, text });
  await page.waitForTimeout(seconds * 1000);
}
try {
  await scene(
    `HAWA: practical smog guidance for families and communities. This records the ${origin.includes("localhost") ? "local production build" : "public deployed application"}.`,
    () => page.goto(origin),
    12,
  );
  await scene(
    "Start with a city or a manual PM2.5 reading. Data sources and model limitations remain visible.",
    async () => {
      await page.getByLabel(/Have a PM2.5/).fill("150");
      await page.getByText("Use reading", { exact: true }).click();
    },
    12,
  );
  await scene(
    "A high reading triggers protective guidance. This is an indicative PM2.5 index, not an official city-wide AQI.",
    () => page.locator(".air-panel").scrollIntoViewIfNeeded(),
    12,
  );
  await scene(
    "Build a household plan tailored to people, home conditions, travel and budget.",
    async () => {
      await page.getByRole("link", { name: /Build my daily plan/ }).click();
      await page.getByLabel("Children", { exact: true }).fill("2");
      await page.getByLabel(/Someone has a heart/).check();
    },
    12,
  );
  await scene(
    "Home inputs include room size, filtration, cooking fuel and safe heating. Indoor coal advice takes priority.",
    () => page.getByRole("button", { name: "2. Home" }).click(),
    11,
  );
  await scene(
    "Travel alternatives respect availability and occupancy. Carbon savings do not automatically mean lower personal exposure.",
    () => page.getByRole("button", { name: "3. Mobility" }).click(),
    11,
  );
  await scene(
    "With the Plan page loaded, we disconnect the network. Rules planning and grounded chat run locally. Online AI personalizes language; code owns every quantity.",
    async () => {
      await page.getByRole("button", { name: "Review & build" }).click();
      await context.setOffline(true);
      await page.getByLabel(/Use rules mode/).check();
      await page.getByRole("button", { name: "Build my daily plan" }).click();
      await page.getByRole("region", { name: "Generated plan" }).waitFor();
      await page.locator(".plan-results").scrollIntoViewIfNeeded();
    },
    14,
  );
  await scene(
    "These are transparent scenarios, not measured health outcomes. The model states its assumptions and uncertainty.",
    () => page.locator(".metrics").scrollIntoViewIfNeeded(),
    12,
  );
  await scene(
    "What-if controls recalculate one combined exposure scenario. Overlapping effects are not added twice.",
    async () => {
      await page.getByText("What if you made these changes?").click();
      await page.locator(".plan-results details.panel input").first().uncheck();
    },
    12,
  );
  await scene(
    "Each action explains its reasoning and links to the source. Qualitative benefits are never dressed up as precise savings.",
    async () => {
      await page.locator(".action-list summary").first().click();
      await page.locator(".action-list").scrollIntoViewIfNeeded();
    },
    12,
  );
  await scene(
    "Ask HAWA retrieves relevant guidance and provides citations. Urgent symptoms bypass ordinary generated advice.",
    async () => {
      await page.getByRole("button", { name: "Ask HAWA" }).click();
      await page
        .getByLabel("Your question")
        .fill("How can I reduce smoke in my kitchen?");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page.locator(".reply a").first().waitFor();
      await page.locator(".chat").scrollIntoViewIfNeeded();
    },
    14,
  );
  await scene(
    "Community leaders get a seven-day kit and adjustable participation assumptions, plus a notice ready to copy or print.",
    async () => {
      await context.setOffline(false);
      await page.getByRole("link", { name: "Community", exact: true }).click();
      await page.getByLabel("Community type").selectOption("School");
      await page.getByLabel("Waste burning", { exact: true }).check();
      await page.getByLabel("Households").fill("400");
      await page.locator(".community-kit").scrollIntoViewIfNeeded();
    },
    12,
  );
  await scene(
    "The library has sixty bilingual entries. Purifier sizing uses room volume. A separate fuel calculator compares input-energy carbon, not equal useful heat or health effects.",
    async () => {
      await page.getByRole("link", { name: "Learn", exact: true }).click();
      await page.getByLabel("Room area (m²)").fill("10");
      await page.getByLabel("Ceiling height (m)").fill("3");
      await page
        .getByRole("combobox", { name: "Fuel", exact: true })
        .selectOption("electric");
      await page
        .getByRole("heading", { name: "Compare fuel input energy" })
        .scrollIntoViewIfNeeded();
    },
    12,
  );
  await scene(
    "Hindi guidance, high-contrast controls and browser read-aloud improve access. Some secondary interface text is still English.",
    async () => {
      await page.getByRole("button", { name: "हिन्दी" }).click();
      await page.getByLabel("Theme").selectOption("hc");
    },
    12,
  );
  await scene(
    "HAWA is open source with tested calculations, guarded model output and visible limitations. General guidance only; urgent symptoms require medical care.",
    async () => {
      await page.getByLabel("Theme").selectOption("light");
      await page.getByRole("button", { name: "English" }).click();
      await page.getByRole("link", { name: "About", exact: true }).click();
    },
    12,
  );
} finally {
  captions.push({ start: (Date.now() - start) / 1000, text: "" });
  writeFileSync(`${demoDir}/captions.json`, JSON.stringify(captions, null, 2));
  await context.close();
  await browser.close();
}
console.log("Demo recording completed.");
