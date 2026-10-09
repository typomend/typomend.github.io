import { expect, test } from "@playwright/test";
import { box, ready, scrollToSection, shot } from "./helpers.ts";

// The first screen: clicking the sentence gives feedback by editing it the
// way a person would (select all, delete), then types the next sentence.

const sentence = (page: import("@playwright/test").Page) =>
  page
    .locator(".hero-line")
    .evaluate((el) =>
      [...el.querySelectorAll(".tk .w")].map((w) => w.textContent).join(""),
    );

test("clicking the sentence selects it, deletes it and types another", async ({
  page,
}, testInfo) => {
  await ready(page);
  await page.waitForFunction(
    () => (document.querySelector(".hero-line")?.textContent.length ?? 0) > 8,
  );
  await page.waitForTimeout(1500);
  const before = await sentence(page);
  const line = await box(page, ".hero-line");
  const clip = {
    x: line.x - 20,
    y: line.y - 20,
    width: line.width + 40,
    height: line.height + 40,
  };

  await page.locator(".hero-line").click();
  await page.waitForTimeout(160);
  expect(await page.locator(".hero-line .tk.sel").count()).toBeGreaterThan(0);
  await shot(page, testInfo, "selecting", clip);

  await page.waitForFunction(
    () => document.querySelectorAll(".hero-line .tk.del").length > 0,
  );
  await page.waitForTimeout(120);
  await shot(page, testInfo, "deleting", clip);

  await page.waitForFunction(
    (old) => {
      const text = [...document.querySelectorAll(".hero-line .tk .w")]
        .map((w) => w.textContent)
        .join("");
      return text.length > 3 && !old.startsWith(text);
    },
    before,
    { timeout: 6000 },
  );
  expect(await page.locator(".hero-line .tk.del").count()).toBe(0);
});

test("the timeline names the scene without a scene number", async ({
  page,
}) => {
  await ready(page);
  await scrollToSection(page, "#problem", 1200);
  const label = await page.locator(".tl-scene").textContent();
  expect(label?.trim()).toBe("問題");
  expect(label).not.toMatch(/S\d/);
});

test("the first screen says what Typomend is from the first moment", async ({
  page,
}) => {
  await page.goto("/");
  const title = page.locator("h1.hero-title");
  await expect(title).toBeVisible();
  await expect(title).toContainText("Typomend");
  await expect(title).toContainText("同音字");
  // The slogan is there too, under the plain description.
  await expect(page.locator(".hero-tag")).toHaveText("照常輸入，原地修正。");
});

test("the timeline tucks away at the bottom of the page", async ({ page }) => {
  await ready(page);
  await scrollToSection(page, "#control", 400);
  await expect(page.locator(".timeline")).toBeVisible();

  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect(page.locator(".timeline")).toBeHidden({ timeout: 3000 });
});
