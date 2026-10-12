import { expect, test, type Page } from "@playwright/test";
import { ready, scrollToEnd, shot, turnSoundOn } from "./helpers.ts";

// The intro film: buttons on the first screen and at the end open a modal
// player, which loads the embed only when opened. While it plays, the site's
// own sound is suspended and the page does not scroll; Escape, the close
// button or a click on the backdrop closes it.

const EMBED = "youtube-nocookie.com/embed/xwAFSuzQJz8";

declare global {
  interface Window {
    audioContexts: AudioContext[];
  }
}

test.beforeEach(async ({ page }) => {
  // The tests stay offline: the player is a blank page at the same address.
  await page.route(/youtube|ytimg|googlevideo/, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<body style='margin:0;background:#111'></body>",
    }),
  );
  // Keeps every audio context the page makes, to read its state.
  await page.addInitScript(() => {
    window.audioContexts = [];
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.audioContexts.push(this);
      }
    };
  });
});

const audioState = (page: Page) =>
  page.evaluate(() => window.audioContexts[0]?.state ?? "none");

const dialog = (page: Page) => page.locator("dialog.film");

test("the first screen opens the film over the page", async ({
  page,
}, testInfo) => {
  await ready(page);
  const button = page.getByRole("button", { name: /觀看介紹影片/ }).first();
  await expect(button).toBeInViewport({ ratio: 1 });
  await expect(dialog(page).locator("iframe")).toHaveCount(0);
  await page.waitForFunction(() =>
    document.querySelector(".hero-tag:not(.is-hidden)"),
  );
  await shot(page, testInfo, "film-hero");

  // With the site's sound on, the film holds it while it plays.
  await turnSoundOn(page);
  await expect(page.locator("html")).toHaveAttribute("data-music", "hero", {
    timeout: 8000,
  });
  await button.click();
  await expect(dialog(page)).toHaveJSProperty("open", true);
  const frame = dialog(page).locator("iframe");
  await expect(frame).toHaveAttribute("src", new RegExp(EMBED));
  await expect(frame).toHaveAttribute("title", "Typomend 介紹影片");
  await expect.poll(() => audioState(page)).toBe("suspended");
  await expect(page.locator("html")).toHaveClass(/lenis-stopped/);
  await page.waitForTimeout(600);
  await shot(page, testInfo, "film-open");

  // The player fits the screen with its close button.
  const size = page.viewportSize() ?? { width: 0, height: 0 };
  for (const selector of [".film-frame", ".film-close"]) {
    const b = await page.locator(selector).boundingBox();
    expect(b, selector).not.toBeNull();
    if (!b) continue;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(size.width);
    expect(b.y + b.height).toBeLessThanOrEqual(size.height);
  }

  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveJSProperty("open", false);
  await expect(frame).toHaveCount(0);
  await expect.poll(() => audioState(page)).toBe("running");
  await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
});

test("the close button and the backdrop close the film", async ({ page }) => {
  await ready(page);
  const button = page.getByRole("button", { name: /觀看介紹影片/ }).first();

  await button.click();
  await page.getByRole("button", { name: "關閉影片" }).click();
  await expect(dialog(page)).toHaveJSProperty("open", false);

  await button.click();
  await expect(dialog(page)).toHaveJSProperty("open", true);
  await page.mouse.click(8, 8);
  await expect(dialog(page)).toHaveJSProperty("open", false);
  await expect(dialog(page).locator("iframe")).toHaveCount(0);
});

test("the end of the page offers the film too", async ({ page }, testInfo) => {
  await ready(page);
  await scrollToEnd(page);
  const cta = page.locator(".finale-cta").getByRole("button", {
    name: "觀看介紹影片",
  });
  await expect(cta).toBeVisible();
  await shot(page, testInfo, "film-finale");
  await cta.click();
  await expect(dialog(page)).toHaveJSProperty("open", true);
  await page.keyboard.press("Escape");

  const link = page.locator(".foot-links").getByRole("link", {
    name: "介紹影片",
  });
  await expect(link).toHaveAttribute("href", "https://youtu.be/xwAFSuzQJz8");
  await expect(link).toHaveAttribute("target", "_blank");
});
