import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Configuration for Kipo SaaS
 *
 * Strategy:
 *  - Tests run against the local Next.js dev server (port 3000)
 *  - webServer auto-starts `npm run dev` before tests
 *  - Only Chromium (desktop) for fast, focused UI validation
 *  - Auth state is saved to e2e/.auth/ to avoid re-login per test
 */
export default defineConfig({
  testDir: "./tests/verified",
  fullyParallel: false, // Sequential for reliable E2E
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 60_000, // 60s per test — UI can be slow
  expect: {
    timeout: 10_000,
  },

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },

  projects: [
    // Setup project: Login once and save auth state
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },
    // Main test project: Uses saved auth state from setup
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/verified/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // Auto-start the dev server
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // 2 min to start Next.js
    stdout: "pipe",
    stderr: "pipe",
  },
});
