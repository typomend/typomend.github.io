import { expect, test, type Page } from "@playwright/test";
import { ready, scrollToEnd, scrollToSection, turnSoundOn } from "./helpers.ts";

// The score: nothing plays or downloads before the first click; then the
// four stems load and the mix follows the scene on screen; it falls away in
// the closing scene; and the sound switch silences it.

const html = (page: Page) => page.locator("html");

test("the score starts with the first click and follows the scenes", async ({
  page,
}) => {
  const stems: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/music/")) stems.push(request.url());
  });
  await ready(page);
  await expect(html(page)).toHaveAttribute("data-music", "idle");
  expect(stems).toHaveLength(0);

  // A click anywhere counts as the gesture browsers require before audio.
  await page.mouse.click(4, 300);
  await expect(html(page)).toHaveAttribute("data-music", "hero", {
    timeout: 8000,
  });
  expect(stems).toHaveLength(4);

  for (const [section, offset, scene] of [
    ["#problem", 1200, "problem"],
    ["#stop", 2400, "stop"],
    ["#world", 2000, "world"],
    ["#try", 0, "try"],
  ] as const) {
    await scrollToSection(page, section, offset);
    await expect(html(page)).toHaveAttribute("data-music", scene);
  }

  await page.locator("button.sound").click();
  await expect(html(page)).toHaveAttribute("data-music-on", "false");
});

declare global {
  interface Window {
    audioTap?: AnalyserNode;
  }
}

/** Routes everything the page plays through an analyser before the speakers. */
async function tapOutput(page: Page) {
  await page.addInitScript(() => {
    const native = Object.getOwnPropertyDescriptor(
      AudioNode.prototype,
      "connect",
    )?.value as (this: AudioNode, ...args: unknown[]) => unknown;
    function connect(this: AudioNode, target: unknown, ...rest: unknown[]) {
      if (!(target instanceof AudioDestinationNode))
        return native.call(this, target, ...rest);
      let tap = window.audioTap;
      if (tap?.context !== target.context) {
        tap = target.context.createAnalyser();
        tap.fftSize = 4096;
        native.call(tap, target);
        window.audioTap = tap;
      }
      return native.call(this, tap, ...rest);
    }
    AudioNode.prototype.connect = connect as typeof AudioNode.prototype.connect;
  });
}

/** The loudest RMS level of the output over half a second, in dBFS. */
function outputLevel(page: Page) {
  return page.evaluate(async () => {
    const tap = window.audioTap;
    if (!tap) return -Infinity;
    const data = new Float32Array(tap.fftSize);
    let loudest = 0;
    for (let i = 0; i < 10; i++) {
      tap.getFloatTimeDomainData(data);
      const power = data.reduce((sum, x) => sum + x * x, 0) / data.length;
      loudest = Math.max(loudest, Math.sqrt(power));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return 20 * Math.log10(Math.max(loudest, 1e-9));
  });
}

test("the score falls away in the closing scene", async ({ page }) => {
  await tapOutput(page);
  await ready(page);
  await turnSoundOn(page);
  await expect(html(page)).toHaveAttribute("data-music", "hero", {
    timeout: 8000,
  });
  await page.waitForTimeout(3000);
  const playing = await outputLevel(page);
  expect(playing).toBeGreaterThan(-45);

  await scrollToEnd(page);
  await expect(html(page)).toHaveAttribute("data-music", "finale");
  // The logo's sting rings for a few seconds; after it nothing plays.
  await page.waitForTimeout(7000);
  const after = await outputLevel(page);
  expect(after).toBeLessThan(playing - 40);
});
