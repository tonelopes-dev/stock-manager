import { test, expect } from "@playwright/test";
import { seedE2EData, disconnect } from "../factories/db-factory";
import path from "path";

/**
 * Suite de testes para o Motor de Promoções
 */
test.describe("Gestão de Cardápio: Motor de Promoções", () => {
  let productId: string;

  test.beforeAll(async () => {
    const data = await seedE2EData();
    // Pegamos o Hambúrguer Caseiro para testar promoções
    const product = Object.values(data.products).find(p => p.name.includes("Hambúrguer"));
    if (!product) throw new Error("Produto de teste não encontrado");
    productId = product.id;
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/menu-management");
    // Garante que estamos na aba de Cardápio
    await page.getByRole("tab", { name: /Cardápio/i }).click();
    // Aguarda o render dos cards
    await page.waitForSelector(`[data-testid^='menu-product-card-']`);
  });

  test("Deve ativar uma promoção e refletir no card do produto", async ({ page }) => {
    const productCard = page.getByTestId(`menu-product-card-${productId}`);
    const openModalBtn = productCard.getByTestId(`open-promotion-modal-${productId}`);

    // 1. Abrir Modal
    await openModalBtn.click();
    await expect(page.getByText("Motor de Promoções")).toBeVisible();

    // 2. Configurar Promoção
    const activeToggle = page.getByTestId("promo-active-toggle");
    const priceInput = page.getByTestId("promo-price-input");
    const saveBtn = page.getByTestId("promo-save-button");

    // Garantir que está ativa
    if (await activeToggle.getAttribute("data-state") !== "checked") {
      await activeToggle.click();
    }
    
    await priceInput.fill("15,50");
    await saveBtn.click();

    // 3. Validar Toast e Fechamento
    await expect(page.getByText("Configurações de promoção atualizadas!")).toBeVisible();
    await expect(page.getByText("Motor de Promoções")).not.toBeVisible();

    // 4. Validar UI do Card
    await expect(productCard.getByText("Promo")).toBeVisible();
    // Usamos regex para ignorar espaços não-quebráveis (R$ 15,50)
    await expect(productCard.getByText(/15,50/)).toBeVisible();
    await expect(productCard).not.toHaveClass(/opacity-70/);
  });

  test("Deve proteger contra Rage Click no salvamento da promoção", async ({ page }) => {
    const productCard = page.getByTestId(`menu-product-card-${productId}`);
    await productCard.getByTestId(`open-promotion-modal-${productId}`).click();

    const saveBtn = page.getByTestId("promo-save-button");
    
    // Simular 5 cliques rápidos
    for (let i = 0; i < 5; i++) {
      saveBtn.click().catch(() => {});
    }

    // O botão deve ficar disabled imediatamente
    await expect(saveBtn).toBeDisabled();
    
    // Deve fechar com sucesso apenas uma vez
    await expect(page.getByText("Configurações de promoção atualizadas!")).toBeVisible();
    await expect(page.getByText("Motor de Promoções")).not.toBeVisible();
  });

  test("Deve desativar a promoção e voltar ao estado normal", async ({ page }) => {
    const productCard = page.getByTestId(`menu-product-card-${productId}`);
    await productCard.getByTestId(`open-promotion-modal-${productId}`).click();

    const activeToggle = page.getByTestId("promo-active-toggle");
    
    // Desativar
    if (await activeToggle.getAttribute("data-state") === "checked") {
      await activeToggle.click();
    }
    
    await page.getByTestId("promo-save-button").click();

    // Aguardar revalidação e fechamento do modal
    await expect(page.getByText("Motor de Promoções")).not.toBeVisible();
    await page.waitForTimeout(2000); // Buffer para revalidation

    // Validar UI
    await expect(productCard.getByText("Promo")).not.toBeVisible();
    // Verificamos que o preço promocional não está mais no card
    await expect(productCard.getByText(/15,50/)).not.toBeVisible();
  });
});
