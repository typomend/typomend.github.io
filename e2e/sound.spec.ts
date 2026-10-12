import { expect, test, type Page } from "@playwright/test";
import {
  ready,
  recordEffects,
  scrollToSection,
  takeEffects,
  turnSoundOn,
} from "./helpers.ts";

// Sound is on by default and starts with the first click, tap or key; until
// then the switch shows a note, which gives way to the bars. Turning sound
// off is remembered, so a later visit stays silent.

const note = (page: Page) => page.locator("button.sound .sound-note");
const bars = (page: Page) => page.locator("button.sound .sound-bars");

test("sound waits for the first click with a note, then plays", async ({
  page,
}) => {
  await recordEffects(page);
  await ready(page);
  const toggle = page.locator("button.sound");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAttribute("data-waiting", "true");
  await expect(note(page)).toHaveCSS("opacity", "1");
  await expect(note(page)).toHaveCSS("animation-name", "note-hop");
  await expect(bars(page)).toHaveCSS("opacity", "0");
  await page.waitForFunction(() =>
    document.querySelector(".hero-tag:not(.is-hidden)"),
  );

  // The first click, here on the first screen's sentence, starts the sound
  // and is answered at once.
  await page.locator(".hero-line").click();
  await expect(toggle).toHaveAttribute("data-waiting", "false");
  await expect(note(page)).toHaveCSS("opacity", "0");
  await expect(note(page)).toHaveCSS("animation-name", "none");
  await expect(bars(page)).toHaveCSS("opacity", "1");
  await expect(page.locator("html")).toHaveAttribute("data-music", "hero", {
    timeout: 8000,
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.effectsPlayed.slice(0, 2).map((e) => e.split(":")[1]),
      ),
    )
    .toEqual(["click_ui", "whoosh_soft"]);
});

test("a key press starts the sound too", async ({ page }) => {
  await ready(page);
  await page.keyboard.press("PageDown");
  await expect(page.locator("button.sound")).toHaveAttribute(
    "data-waiting",
    "false",
  );
  // The key also moves the page on, so the score follows whichever scene is
  // showing.
  await expect(page.locator("html")).not.toHaveAttribute("data-music", "idle", {
    timeout: 8000,
  });
});

test("the first press on the switch starts the sound, not stops it", async ({
  page,
}) => {
  await ready(page);
  const toggle = page.locator("button.sound");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAttribute("data-waiting", "false");
});

test("turning sound off is remembered", async ({ page }) => {
  await ready(page);
  const toggle = page.locator("button.sound");
  await toggle.click();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  // On the next visit nothing plays or downloads, whatever is clicked.
  const downloads: string[] = [];
  page.on("request", (request) => {
    if (/\/(music|sfx)\//.test(request.url())) downloads.push(request.url());
  });
  await ready(page);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(toggle).toHaveAttribute("data-waiting", "false");
  await page.locator(".hero-line").click();
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(1800);
  await expect(page.locator("html")).toHaveAttribute("data-music", "idle");
  expect(downloads).toHaveLength(0);

  // Turned back on, it stays on.
  await toggle.click();
  await ready(page);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAttribute("data-waiting", "true");
});

declare global {
  interface Window {
    effectsLog: string[];
  }
}

// Effects play while the viewer scrolls the way people do, in bursts of a
// few notches; they are skipped while the page rushes past and come back
// once it slows. The music plays on throughout.
test("effects play at a normal pace and are skipped while the page rushes past", async ({
  page,
}) => {
  await recordEffects(page);
  await ready(page);
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-effects", "play");
  await turnSoundOn(page);
  await expect(html).toHaveAttribute("data-music", "hero", { timeout: 8000 });
  await page.evaluate(() => {
    window.effectsLog = [];
    const record = () => {
      window.effectsLog.push(document.documentElement.dataset.effects ?? "");
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });
  const log = () => page.evaluate(() => [...new Set(window.effectsLog)]);

  for (let burst = 0; burst < 10; burst++) {
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(600);
  }
  expect(await log()).toEqual(["play"]);
  const played = await takeEffects(page);
  expect(played.filter((e) => e.startsWith("problem:")).length).toBeGreaterThan(
    3,
  );

  // A flick skips them.
  await page.evaluate(() => {
    window.effectsLog = [];
  });
  for (let i = 0; i < 20; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(16);
  }
  expect(await log()).toContain("skip");

  await expect(html).toHaveAttribute("data-effects", "play", {
    timeout: 4000,
  });
});

// 要改它，就得停下來: each of the three words lands with a hit, the last one
// the heaviest.
test("each word of the stop line lands with a hit", async ({ page }) => {
  await recordEffects(page);
  await ready(page);
  const html = page.locator("html");
  await turnSoundOn(page);
  await expect(html).toHaveAttribute("data-music", "hero", { timeout: 8000 });
  await scrollToSection(page, "#stop", -300);
  await expect(html).toHaveAttribute("data-effects", "play");
  await takeEffects(page);

  for (let i = 0; i < 16; i++) {
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(800);
  const hits = (await takeEffects(page))
    .map((e) => e.split(":")[1])
    .filter((name) => name === "hit_word" || name === "hit_stop");
  expect(hits).toEqual(["hit_word", "hit_word", "hit_stop"]);
});
