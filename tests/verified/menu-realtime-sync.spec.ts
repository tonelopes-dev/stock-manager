import { test, expect, BrowserContext, Page } from "@playwright/test";
import { seedE2EData, disconnect } from "../factories/db-factory";
import path from "path";

/**
 * Suite de testes para validação de Sincronização em Tempo Real (Supabase)
 * Simula a interação do Admin vs Cliente Final
 */
test.describe("Real-time: Gestão vs Cardápio Público", () => {
  let adminContext: BrowserContext;
  let publicContext: BrowserContext;
  let adminPage: Page;
  let publicPage: Page;
  let productId: string;
  let productName: string;

  test.beforeAll(async ({ browser }) => {
    // 1. Seed de dados
    const data = await seedE2EData();
    const product = Object.values(data.products)[0];
    productId = product.id;
    productName = product.name;

    // 2. Criar contexto de Admin (autenticado via global-setup)
    const adminStorage = path.join(__dirname, ".auth/user.json");
    adminContext = await browser.newContext({ storageState: adminStorage });
    adminPage = await adminContext.newPage();

    // 3. Criar contexto de Cliente (Anônimo)
    publicContext = await browser.newContext();
    publicPage = await publicContext.newPage();
  });

  test.afterAll(async () => {
    await adminContext.close();
    await publicContext.close();
    await disconnect();
  });

  test("Deve ocultar/exibir produto no cardápio público em tempo real", async () => {
    const slug = "e2e-rota-360";

    // Log console from public page
    publicPage.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('sync')) {
        console.log(`Public Page LOG: ${msg.text()}`);
      }
    });

    // 1. Abrir os dois lados
    await adminPage.goto("/menu-management");
    await adminPage.waitForLoadState("networkidle");
    await adminPage.getByRole("tab", { name: /Cardápio/i }).click();

    await publicPage.goto(`/${slug}`);
    await publicPage.waitForLoadState("networkidle");

    // Garante que o produto está visível inicialmente no público
    const publicProduct = publicPage.getByTestId(`public-product-card-${productId}`);
    
    // Diagnóstico se falhar
    if (await publicProduct.count() === 0) {
      const allProductIds = await publicPage.locator('[data-testid^="public-product-card-"]').evaluateAll(els => els.map(el => el.getAttribute('data-testid')));
      console.log(`WARN: Product ID ${productId} not found. Found IDs:`, allProductIds);
    }

    await expect(publicProduct).toBeVisible({ timeout: 30_000 });

    // 2. No Admin: Ocultar produto
    console.log("Admin: Ocultando produto...");
    const visibilitySwitch = adminPage.getByTestId(`visibility-switch-${productId}`);
    
    // Se estiver ligado (checked), desliga
    if (await visibilitySwitch.getAttribute("data-state") === "checked") {
      await visibilitySwitch.click();
      await expect(adminPage.getByText(/removido do cardápio/i)).toBeVisible();
    }

    // 3. No Público: Deve desaparecer sem refresh (via Supabase Realtime)
    console.log("Público: Validando desaparecimento realtime...");
    await expect(publicProduct).not.toBeVisible({ timeout: 20_000 });

    // 4. No Admin: Exibir novamente
    console.log("Admin: Exibindo produto...");
    await visibilitySwitch.click();
    await expect(adminPage.getByText(/adicionado ao cardápio/i)).toBeVisible();

    // 5. No Público: Deve reaparecer
    console.log("Público: Validando reaparecimento realtime...");
    await expect(publicProduct).toBeVisible({ timeout: 20_000 });
  });
});
