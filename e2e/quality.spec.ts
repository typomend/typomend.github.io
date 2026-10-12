import { expect, test, type Page } from "@playwright/test";

// Effects follow what the device can carry. A device that reports little
// memory and few cores starts at lite quality, where the glass is solid and
// nothing refracts; a page that keeps dropping frames while scrolling drops
// to lite for the rest of the visit; and scenes out of view pause their CSS
// animations. These tests clear the level the other tests pin to full.

/** Pretends to be a device with `cores` CPU cores and `memory` GB of memory. */
async function device(page: Page, cores: number, memory: number) {
  await page.addInitScript(
    ([c, m]) => {
      localStorage.removeItem("typomend:quality");
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => c });
      Object.defineProperty(navigator, "deviceMemory", { get: () => m });
    },
    [cores, memory] as const,
  );
}

const level = (page: Page) =>
  page.evaluate(() => document.documentElement.dataset.quality);

const backdrop = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => getComputedStyle(el).backdropFilter);

test("a capable device gets the full effects", async ({ page }) => {
  await device(page, 8, 8);
  await page.goto("/");
  expect(await level(page)).toBe("full");
  expect(await backdrop(page, ".hud-download")).toContain("blur");
});

test("a low-end device starts with lighter effects", async ({ page }) => {
  await device(page, 4, 2);
  await page.goto("/");
  expect(await level(page)).toBe("lite");
  expect(await backdrop(page, ".hud-download")).toBe("none");
  expect(
    await page.evaluate(() =>
      document.documentElement.classList.contains("glass-lens"),
    ),
  ).toBe(false);
});

test("the level can be chosen in the address", async ({ page }) => {
  await device(page, 8, 8);
  await page.goto("/?quality=lite");
  expect(await level(page)).toBe("lite");
});

test("a page that keeps dropping frames while scrolling lowers its effects", async ({
  page,
}) => {
  await device(page, 8, 8);
  // Each frame is held up for 40 ms, as on a phone that cannot keep up.
  await page.addInitScript(() => {
    const busy = () => {
      const until = performance.now() + 40;
      while (performance.now() < until) {
        // Keep the main thread busy.
      }
      requestAnimationFrame(busy);
    };
    requestAnimationFrame(busy);
  });
  await page.goto("/");
  expect(await level(page)).toBe("full");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const end = performance.now() + 6000;
        const step = () => {
          window.scrollBy(0, 12);
          if (performance.now() < end) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
  );
  await expect.poll(() => level(page)).toBe("lite");
  expect(await backdrop(page, ".hud-download")).toBe("none");
});

test("scenes out of view pause their animations", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(
    () => document.querySelectorAll(".pin-spacer").length > 0,
  );
  const cue = () =>
    page
      .locator(".cue-line")
      .evaluate((el) => getComputedStyle(el).animationPlayState);
  expect(await cue()).toBe("running");
  await page.evaluate(() => {
    const world = document.querySelector("#world");
    if (world) window.scrollTo(0, world.getBoundingClientRect().top + scrollY);
  });
  await expect
    .poll(() => page.locator("#hero").getAttribute("data-idle"))
    .toBe("");
  expect(await cue()).toBe("paused");
});
