import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Playwright E2E Configuration for Kipo ERP
 *
 * Strategy:
 *  - Tests run against the local Next.js dev server (port 3000)
 *  - webServer auto-starts `npm run dev` before tests
 *  - Sequential execution (workers: 1) to prevent DB race conditions
 *  - Auth state saved in tests/verified/.auth/
 */
export default defineConfig({
  testDir: "./tests/verified",
  fullyParallel: false, 
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Strict sequential for E2E reliability
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 90_000, // 90s for heavy multi-persona flows
  expect: {
    timeout: 15_000,
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
        storageState: path.join(__dirname, "tests/verified/.auth/user.json"),
      },
      dependencies: ["setup"],
    },
  ],

  // Auto-start the dev server
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
