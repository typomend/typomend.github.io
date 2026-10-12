import { expect, test, type Page } from "@playwright/test";
import { box, ready, scrollToEnd, scrollToSection, shot } from "./helpers.ts";

// The layout on every screen size: no sideways scrolling, a top bar whose
// controls fit and do not overlap, tap targets large enough for a finger,
// and glass that renders. Each section is saved as a screenshot for review.

const SECTIONS: [name: string, go: (page: Page) => Promise<void>][] = [
  [
    "first-screen",
    async (page) => {
      // Wait for the first sentence to be typed and mended.
      await page.waitForFunction(
        () =>
          (document.querySelector(".hero-line")?.textContent.length ?? 0) > 8,
      );
      await page.waitForTimeout(2500);
    },
  ],
  ["problem", (page) => scrollToSection(page, "#problem", 1400)],
  ["manual-fix", (page) => scrollToSection(page, "#stop", 2600)],
  ["desktops", (page) => scrollToSection(page, "#world", 2200)],
  ["settings", (page) => scrollToSection(page, "#control", 400)],
  ["try", (page) => scrollToSection(page, ".pad", -120)],
  ["end", scrollToEnd],
];

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: typeof a,
) {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

test.describe("layout on this screen size", () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  test("every section fits the width", async ({ page }, testInfo) => {
    for (const [name, go] of SECTIONS) {
      await go(page);
      const { scroll, width } = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        width: window.innerWidth,
      }));
      expect(scroll, `${name} scrolls sideways`).toBeLessThanOrEqual(width);
      await shot(page, testInfo, name);
    }
  });

  test("the top bar's controls fit, do not overlap, and are easy to hit", async ({
    page,
    isMobile,
  }, testInfo) => {
    const size = page.viewportSize() ?? { width: 0, height: 0 };
    const selectors = [
      ".hud-logo",
      ".hud-download",
      ".hud-icon >> nth=0",
      ".hud-icon >> nth=1",
    ];
    const boxes = await Promise.all(selectors.map((s) => box(page, s)));
    for (const [i, b] of boxes.entries()) {
      expect(b.x, `${selectors[i]} starts off screen`).toBeGreaterThanOrEqual(
        0,
      );
      expect(
        b.x + b.width,
        `${selectors[i]} ends off screen`,
      ).toBeLessThanOrEqual(size.width);
      for (const other of boxes.slice(i + 1))
        expect(overlaps(b, other)).toBe(false);
    }
    // Apple's HIG asks for 44 pt on touch screens; WCAG 2.2 asks for at least 24 px.
    const least = isMobile ? 44 : 24;
    for (const b of boxes.slice(1)) {
      expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(least);
    }
    const filter = await page
      .locator(".hud-download")
      .evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(filter).toContain("blur");
    await shot(page, testInfo, "top-bar", {
      x: 0,
      y: 0,
      width: size.width,
      height: Math.min(size.height, 72),
    });
  });

  test("the sample sentences can be tapped or clicked", async ({
    page,
    isMobile,
  }) => {
    await scrollToSection(page, ".pad", -120);
    const chip = page.locator(".chip").first();
    if (isMobile) await chip.tap();
    else await chip.click();
    await expect(page.locator(".pad-edit")).not.toBeEmpty({ timeout: 4000 });
  });
});
