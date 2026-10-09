import type { Page, TestInfo } from "@playwright/test";

export interface Clip {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Opens the site and waits until the fonts are in and the scenes are pinned. */
export async function ready(page: Page) {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => document.querySelectorAll(".pin-spacer").length > 0,
  );
  await parkPointer(page);
}

/** Moves the pointer to the left edge, away from every control. */
export async function parkPointer(page: Page) {
  const size = page.viewportSize();
  await page.mouse.move(4, Math.round((size?.height ?? 800) * 0.45));
}

export async function shot(
  page: Page,
  testInfo: TestInfo,
  name: string,
  clip?: Clip,
) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, clip });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

export async function box(page: Page, selector: string) {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`${selector} is not visible`);
  return b;
}

/** A clip around a box with some margin, kept inside the viewport. */
export function around(page: Page, b: Clip, margin: number): Clip {
  const size = page.viewportSize() ?? { width: 1440, height: 900 };
  const x = Math.max(0, b.x - margin);
  const y = Math.max(0, b.y - margin);
  return {
    x,
    y,
    width: Math.min(size.width - x, b.width + margin * 2),
    height: Math.min(size.height - y, b.height + margin * 2),
  };
}

/** A registered custom property's computed value on a pseudo-element. */
export function pseudoValue(
  page: Page,
  selector: string,
  pseudo: string,
  name: string,
) {
  return page.evaluate(
    ([sel, pse, prop]) => {
      const el = document.querySelector(sel);
      if (!el) return NaN;
      return parseFloat(getComputedStyle(el, pse).getPropertyValue(prop));
    },
    [selector, pseudo, name] as const,
  );
}

export async function scrollToSection(
  page: Page,
  selector: string,
  offset = 0,
) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel);
      if (el)
        window.scrollTo(
          0,
          el.getBoundingClientRect().top + window.scrollY + off,
        );
    },
    [selector, offset] as const,
  );
  await page.waitForTimeout(1500);
}

/**
 * Scrolls to the end of the closing scene's pin, where the mark, the tagline
 * and the call to action have all settled on screen.
 */
export async function scrollToEnd(page: Page) {
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.waitForTimeout(1200);
  const pin = await page.evaluate(() => Math.round(window.innerHeight * 1.6));
  await scrollToSection(page, "#finale", pin);
}

export interface Luminance {
  mean: number;
  max: number;
}

/**
 * The mean and brightest luminance (0 to 255) in a part of the page, read
 * from a screenshot. `columns` limits the reading to a share of the width,
 * for example [0.25, 0.75] to skip rounded ends.
 */
export async function luminance(
  page: Page,
  clip: Clip,
  columns: [number, number] = [0, 1],
): Promise<Luminance> {
  const png = await page.screenshot({ clip });
  return page.evaluate(
    async ([data, from, to]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${data}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return { mean: NaN, max: NaN };
      ctx.drawImage(img, 0, 0);
      const { data: px } = ctx.getImageData(0, 0, img.width, img.height);
      const x0 = Math.floor(img.width * from);
      const x1 = Math.ceil(img.width * to);
      let sum = 0;
      let max = 0;
      let n = 0;
      for (let y = 0; y < img.height; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * img.width + x) * 4;
          const l =
            0.2126 * (px[i] ?? 0) +
            0.7152 * (px[i + 1] ?? 0) +
            0.0722 * (px[i + 2] ?? 0);
          sum += l;
          max = Math.max(max, l);
          n += 1;
        }
      }
      return { mean: sum / n, max };
    },
    [png.toString("base64"), columns[0], columns[1]] as const,
  );
}
