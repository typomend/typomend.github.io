import { expect, test } from "@playwright/test";
import { ready } from "./helpers.ts";

// Sound is on by default, and the viewer's choice survives a reload.

test("sound is on by default and the choice is remembered", async ({
  page,
}) => {
  await ready(page);
  const toggle = page.locator("button.sound");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await ready(page);
  await expect(page.locator("button.sound")).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await page.locator("button.sound").click();
  await ready(page);
  await expect(page.locator("button.sound")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
