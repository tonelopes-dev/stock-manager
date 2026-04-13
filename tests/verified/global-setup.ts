/**
 * Playwright Global Setup — Authentication
 *
 * Logs in as the seed user "Matheus" (Owner) via the /login page
 * and saves the auth state (cookies + localStorage) to a file.
 * Subsequent tests reuse this state, avoiding re-login every test.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate as Matheus (Owner)", async ({ page }) => {
  // Navigate to login
  console.log("Navigating to /login...");
  await page.goto("/login", { waitUntil: "networkidle", timeout: 60_000 });

  // Fill credentials from seed.ts (password: "senha123")
  console.log("Filling credentials...");
  await page.getByLabel("Email").waitFor({ state: "visible", timeout: 30_000 });
  await page.getByLabel("Email").fill("matheus@rota360.com");
  await page.getByLabel("Senha").fill("senha123");

  // Submit
  console.log("Submitting login form...");
  await page.getByRole("button", { name: "Entrar" }).click();

  // Wait for redirect to the dashboard (protected layout loaded)
  console.log("Waiting for redirect...");
  await page.waitForURL("/**", { timeout: 60_000 });

  // Handle Cookie Banner if present
  const cookieBannerButton = page.getByRole("button", { name: /Aceitar e Fechar/i });
  if (await cookieBannerButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cookieBannerButton.click();
  }

  // Ensure we're past the login page (layout should have sidebar)
  await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

  // Save auth state
  await page.context().storageState({ path: AUTH_FILE });
});
