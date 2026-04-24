/**
 * Playwright Global Setup — Authentication & Seeding
 *
 * 1. Seeds the database via E2E Factory (isolated test data)
 * 2. Logs in as the seed user "Matheus" (Owner) via the /login page
 * 3. Saves the auth state (cookies + localStorage) to a file.
 * Subsequent tests reuse this state, avoiding re-login every test.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";
import { seedE2EData, disconnect } from "../factories/db-factory";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("seed data and authenticate as Matheus (Owner)", async ({ page }) => {
  // 1. Seed the database
  try {
    await seedE2EData();
  } finally {
    await disconnect();
  }

  // 2. Navigate to login
  console.log("Navigating to /login...");
  await page.goto("/login");

  // 3. Fill credentials from factory (password: "senha123")
  console.log("Filling credentials...");
  await page.getByLabel("Email").fill("e2e-matheus@rota360.com");
  await page.getByLabel("Senha").fill("senha123");

  // 4. Submit
  console.log("Submitting login form...");
  await page.getByRole("button", { name: "Entrar" }).click();

  // 5. Wait for redirect to the dashboard (protected layout loaded)
  console.log("Waiting for redirect...");
  await page.waitForURL("/**", { timeout: 60_000 });

  // Handle Cookie Banner if present
  const cookieBannerButton = page.getByRole("button", { name: /Aceitar e Fechar/i });
  if (await cookieBannerButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cookieBannerButton.click();
  }

  // 6. Ensure we're past the login page (layout should have sidebar)
  await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

  // 7. Save auth state
  await page.context().storageState({ path: AUTH_FILE });
});
