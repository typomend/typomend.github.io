import { expect, test, type Page } from "@playwright/test";
import {
  around,
  box,
  luminance,
  parkPointer,
  ready,
  scrollToEnd,
  scrollToSection,
  shot,
} from "./helpers.ts";

// Every colour of glass control must visibly light up under the pointer:
// the blue tinted glass, the white glass on light pages, and the glass over
// dark scenes. Each case measures the control's mean luminance at rest and
// on hover, and saves both screenshots for review.

/** The least change in mean luminance (0 to 255) that reads as lit. */
const MIN_LIFT = 6;

interface Case {
  name: string;
  selector: string;
  /** Takes the page to where the control is. */
  go?: (page: Page) => Promise<void>;
}

const toDarkScene = (page: Page) => scrollToSection(page, "#problem", 1200);

const CASES: Case[] = [
  { name: "tinted-light-page", selector: ".hud-download" },
  { name: "white-light-page", selector: ".hud-icon" },
  {
    name: "white-chip",
    selector: ".chip:nth-child(3)",
    go: (page) => scrollToSection(page, ".pad-chips", -420),
  },
  {
    name: "white-end-of-page",
    selector: ".finale-cta .btn-ghost",
    go: scrollToEnd,
  },
  {
    name: "tinted-end-of-page",
    selector: ".finale-cta .btn-primary",
    go: scrollToEnd,
  },
  { name: "white-dark-scene", selector: ".hud-icon", go: toDarkScene },
  { name: "capsule-dark-scene", selector: ".hud-nav", go: toDarkScene },
];

test.describe("every colour of glass lights up on hover", () => {
  for (const c of CASES) {
    test(c.name, async ({ page }, testInfo) => {
      await ready(page);
      if (c.go) await c.go(page);
      await parkPointer(page);
      await page.waitForTimeout(500);

      const b = await box(page, c.selector);
      const rest = await luminance(page, b);
      await shot(page, testInfo, `${c.name}-rest`, around(page, b, 24));

      await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.45);
      await page.waitForTimeout(650);
      const lit = await luminance(page, b);
      await shot(page, testInfo, `${c.name}-hover`, around(page, b, 24));

      const lift = lit.mean - rest.mean;
      testInfo.annotations.push({
        type: "lift",
        description: `${c.name}: ${rest.mean.toFixed(1)} -> ${lit.mean.toFixed(1)} (${lift.toFixed(1)})`,
      });
      console.log(`lift ${c.name}: ${lift.toFixed(1)}`);
      expect(lift).toBeGreaterThan(MIN_LIFT);
    });
  }
});
