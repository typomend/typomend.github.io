import { expect, test, type Page } from "@playwright/test";
import {
  box,
  luminance,
  parkPointer,
  pseudoValue,
  ready,
  scrollToEnd,
  scrollToSection,
  shot,
} from "./helpers.ts";

// Liquid Glass controls with a reveal light: the material at rest, the rim
// catching the light as the pointer comes near, the glow from within on
// hover, and the flex on press. Every test also saves a screenshot so the
// look can be reviewed, under test-results/.

const HUD_RIGHT = { x: 980, y: 0, width: 460, height: 64 };

/** The brightest luminance along the middle half of a control's bottom rim. */
async function bottomRimLuminance(page: Page, selector: string) {
  const b = await box(page, selector);
  const { max } = await luminance(
    page,
    { x: b.x, y: b.y + b.height - 3, width: b.width, height: 3 },
    [0.25, 0.75],
  );
  return max;
}

test.describe("Liquid Glass controls", () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  test("the controls are glass at rest", async ({ page }, testInfo) => {
    const styles = await page.evaluate(() =>
      [".hud-download", ".hud-icon", ".chip"].map((sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).backdropFilter : "";
      }),
    );
    for (const filter of styles) expect(filter).toContain("blur");
    expect(
      await page
        .locator(".hud-download")
        .evaluate((el) => getComputedStyle(el).backgroundImage),
    ).toContain("linear-gradient");
    await shot(page, testInfo, "rest", HUD_RIGHT);
  });

  test("the rim catches the light as the pointer comes near", async ({
    page,
  }, testInfo) => {
    const a = await box(page, ".hud-download");
    const b = await box(page, ".hud-icon");
    // Between two controls, over neither of them.
    await page.mouse.move((a.x + a.width + b.x) / 2, a.y + a.height + 8);
    await page.waitForTimeout(450);
    await expect(page.locator(".hud-download")).toHaveAttribute(
      "data-near",
      "",
    );
    await expect(page.locator(".hud-icon").first()).toHaveAttribute(
      "data-near",
      "",
    );
    expect(
      await pseudoValue(page, ".hud-download", "::after", "--rim-a"),
    ).toBeGreaterThan(0.95);
    expect(
      await pseudoValue(page, ".hud-download", "::before", "--glow-a"),
    ).toBe(0);
    await shot(page, testInfo, "near", HUD_RIGHT);
  });

  test("hovering the tinted button does not light a white line along its bottom", async ({
    page,
  }) => {
    const rest = await bottomRimLuminance(page, ".hud-download");
    const a = await box(page, ".hud-download");
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.waitForTimeout(600);
    const hover = await bottomRimLuminance(page, ".hud-download");
    // The rim is lit from above: on hover the bottom edge stays blue.
    expect(hover).toBeLessThan(200);
    expect(hover - rest).toBeLessThan(30);
  });

  test("the glass lights from within on hover", async ({ page }, testInfo) => {
    const a = await box(page, ".hud-download");
    await page.mouse.move(a.x + a.width * 0.35, a.y + a.height / 2);
    await page.waitForTimeout(600);
    expect(
      await pseudoValue(page, ".hud-download", "::before", "--glow-a"),
    ).toBeGreaterThan(0.6);
    await shot(page, testInfo, "hover-tinted", HUD_RIGHT);

    const icon = await box(page, ".hud-icon");
    await page.mouse.move(
      icon.x + icon.width * 0.4,
      icon.y + icon.height * 0.4,
    );
    await page.waitForTimeout(600);
    await shot(page, testInfo, "hover-regular", HUD_RIGHT);
  });

  test("pressing flexes the glass and spreads the glow, without a ripple", async ({
    page,
  }, testInfo) => {
    const a = await box(page, ".hud-download");
    await page.mouse.move(a.x + a.width * 0.3, a.y + a.height / 2);
    await page.waitForTimeout(300);
    await page.mouse.down();
    await page.waitForTimeout(320);
    const scale = await page
      .locator(".hud-download")
      .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    expect(scale).toBeGreaterThan(1.02);
    expect(
      await pseudoValue(page, ".hud-download", "::before", "--glow-r"),
    ).toBeGreaterThan(200);
    await expect(page.locator(".hud-icon").first()).toHaveAttribute(
      "data-echo",
      "",
    );
    expect(await page.locator(".reveal-press").count()).toBe(0);
    await shot(page, testInfo, "press", HUD_RIGHT);

    await page.mouse.up();
    await parkPointer(page);
    await page.waitForTimeout(900);
    const rest = await page
      .locator(".hud-download")
      .evaluate((el) => getComputedStyle(el).transform);
    expect(rest === "none" || new DOMMatrix(rest).a === 1).toBe(true);
  });

  test("over a dark scene, with the chapter capsule", async ({
    page,
  }, testInfo) => {
    await scrollToSection(page, "#problem", 1200);
    await expect(page.locator(".hud")).toHaveAttribute("data-tone", "dark");
    const nav = await box(page, ".hud-nav a:nth-child(2)");
    await page.mouse.move(nav.x + nav.width / 2, nav.y + nav.height / 2);
    await page.waitForTimeout(600);
    expect(
      await pseudoValue(page, ".hud-nav", "::before", "--glow-a"),
    ).toBeGreaterThan(0.6);
    await shot(page, testInfo, "dark-hud", {
      x: 0,
      y: 0,
      width: 1440,
      height: 64,
    });
  });

  test("over moving content, the glass blurs what passes under it", async ({
    page,
  }, testInfo) => {
    await scrollToSection(page, "#world", 900);
    await parkPointer(page);
    await shot(page, testInfo, "over-content", {
      x: 0,
      y: 0,
      width: 1440,
      height: 64,
    });
  });

  test("chips on a light surface", async ({ page }, testInfo) => {
    await scrollToSection(page, ".pad-chips", -420);
    const chips = page.locator(".chip");
    const second = await chips.nth(1).boundingBox();
    if (!second) throw new Error("chip not visible");
    await page.mouse.move(
      second.x + second.width * 0.3,
      second.y + second.height / 2,
    );
    await page.waitForTimeout(600);
    await shot(page, testInfo, "chips", {
      x: second.x - 240,
      y: second.y - 24,
      width: 640,
      height: second.height + 48,
    });
  });

  test("the call to action at the end", async ({ page }, testInfo) => {
    await scrollToEnd(page);
    const cta = await box(page, ".finale-cta");
    const primary = await box(page, ".finale-cta .btn-primary");
    await page.mouse.move(
      primary.x + primary.width * 0.7,
      primary.y + primary.height / 2,
    );
    await page.waitForTimeout(600);
    await shot(page, testInfo, "finale", {
      x: cta.x - 60,
      y: cta.y - 30,
      width: cta.width + 120,
      height: cta.height + 60,
    });
  });

  test("the rim bends what is behind it, in Chromium", async ({
    page,
  }, testInfo) => {
    await expect(page.locator("html")).toHaveClass(/glass-lens/);
    // Busy stripes behind the bar, and none of the bar's own backdrop, so the
    // bending near the rim is visible.
    await page.addStyleTag({
      content: `
        .hero { background: repeating-linear-gradient(90deg, #0b0f1a 0 3px, #f4f6f8 3px 12px) !important; }
        .hud::before { display: none !important; }
      `,
    });
    await page.waitForTimeout(300);
    await shot(page, testInfo, "refraction", HUD_RIGHT);
  });

  test("reduced transparency makes the glass opaque", async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
    });
    const filter = await page
      .locator(".hud-icon")
      .first()
      .evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(filter).toBe("none");
  });
});
