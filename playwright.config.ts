import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

const touch = {
  browserName: "chromium" as const,
  isMobile: true,
  hasTouch: true,
};

// End-to-end tests run against the production build, served by `vite preview`.
// The pointer tests run where there is a mouse; the layout tests run on every
// screen size, from a phone held either way to a desktop.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: "laptop",
      testMatch: /(glass-colors|responsive)\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1.5,
      },
    },
    {
      name: "tablet",
      testMatch: /responsive\.spec\.ts/,
      use: {
        ...touch,
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: "phone",
      testMatch: /responsive\.spec\.ts/,
      use: {
        ...touch,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
      },
    },
    {
      name: "phone-landscape",
      testMatch: /responsive\.spec\.ts/,
      use: {
        ...touch,
        viewport: { width: 844, height: 390 },
        deviceScaleFactor: 3,
      },
    },
  ],
});
