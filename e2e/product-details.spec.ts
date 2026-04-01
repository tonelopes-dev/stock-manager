import { test, expect } from "@playwright/test";

test.describe("Product Details E2E Tests (Inline)", () => {
  test("should edit price inline and change product type from REVENDA to COMBO", async ({ page }) => {
    // 1. Navigate to Products page
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /^Produtos$/i })).toBeVisible({ timeout: 15_000 });

    // Handle Cookie Banner if present
    const cookieBannerButton = page.getByRole("button", { name: /Aceitar e Fechar/i });
    if (await cookieBannerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBannerButton.click();
    }

    // 2. Find a REVENDA product and click to view details
    // We want to test switching from Revenda -> Combo
    const revendaLink = page.getByRole("link", { name: /Revenda/i }).first();
    await expect(revendaLink).toBeVisible({ timeout: 5000 });
    await revendaLink.click();

    // 3. Verify we are on the details page and it's a "Produto Simples" (No recipe table)
    await page.waitForURL(/\/products\/[a-zA-Z0-9-]+/);
    await expect(page.getByText(/Produto Simples/i)).toBeVisible();
    await expect(page.getByText(/Ficha Técnica/i)).toBeHidden();

    // 4. Test Inline Financial Edit
    // Search for edit icon in financial summary card
    const financialCard = page.locator('div:has-text("Resumo Financeiro")').first();
    await financialCard.locator('button').first().click(); // Click Edit button

    const priceInput = page.locator('input[value*="R$"]');
    await expect(priceInput).toBeVisible();
    await priceInput.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("75,00");
    
    // Click Save (Check icon)
    await page.locator('button:has(svg)').filter({ hasText: "" }).nth(1).click();
    await expect(page.getByText("R$ 75,00")).toBeVisible({ timeout: 10_000 });

    // 5. Test Product Type Switch (REVENDA -> COMBO)
    // Use the identification edit button
    await page.getByRole("button", { name: /Editar Identificação/i }).click();
    
    // Open type selector
    const typeSelect = page.getByRole("combobox").first();
    await typeSelect.click();
    
    // Selecting COMBO (ensure it is the right option)
    await page.getByRole("option", { name: "Combo" }).click();
    
    // Click "Salvar" button in header
    await page.getByRole("button", { name: /Salvar/i }).click();

    // 6. Verify "Ficha Técnica" appears after reload
    await expect(page.getByText(/Ficha Técnica/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Adicionar Item à Composição/i)).toBeVisible();

    // 7. Test Adding an Item to the new Combo
    const comboboxTrigger = page.locator('[role="combobox"]').filter({ hasText: /Selecionar item/i }).first();
    await expect(comboboxTrigger).toBeVisible();
    await comboboxTrigger.click();
    await page.keyboard.type("Re", { delay: 100 });
    await page.waitForTimeout(500);

    const firstOption = page.locator('[role="option"]').first();
    await firstOption.click();

    const quantityInput = page.getByPlaceholder("Qtd");
    await quantityInput.fill("1");
    await page.getByRole("button", { name: /Adicionar/i }).filter({ hasText: /^Adicionar$/ }).click();

    await expect(page.getByText(/sucesso/i)).toBeVisible();
  });
});
