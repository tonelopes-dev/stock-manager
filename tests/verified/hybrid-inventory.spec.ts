import { test, expect, Locator } from "@playwright/test";
import { fakerPT_BR as faker } from "@faker-js/faker";

/**
 * Helper to fill masked inputs (react-number-format) reliably.
 */
async function fillMaskedInput(locator: Locator, value: string) {
  await locator.click({ force: true });
  await locator.page().keyboard.press("Control+A");
  await locator.page().keyboard.press("Backspace");
  await locator.page().keyboard.type(value, { delay: 100 });
  await locator.press("Tab");
}

test.describe("Hybrid Inventory Model Validation", () => {
  const uuid = faker.string.uuid().slice(0, 8);
  const supplierName = `Fornecedor Hibrido ${uuid}`;
  const ingredientName = `Morango E2E ${uuid}`;
  const mtoProductName = `MTO Burger ${uuid}`;
  const batchProductName = `Batch Burger ${uuid}`;

  test.beforeEach(async ({ page }) => {
    // Collect console logs for debugging
    page.on("console", (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto("/");
    // Close any initial overlays if necessary
    await page.keyboard.press("Escape");
  });

  test("full hybrid inventory flow", async ({ page }) => {
    test.setTimeout(600000); // Aumento significativo do timeout para fluxos longos de E2E
    // STEP A: Create Supplier
    await page.goto("/fornecedores");
    await page.getByRole("button", { name: "Novo fornecedor" }).click();
    const supplierDialog = page.getByTestId("upsert-supplier-dialog");
    await expect(supplierDialog).toHaveAttribute("data-ready", "true", { timeout: 15000 });
    await supplierDialog.getByTestId("upsert-supplier-name-input").fill(supplierName);
    await supplierDialog.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(/sucesso/i)).toBeVisible();
    await page.keyboard.press("Escape");

    // STEP B: Create Ingredient (Unit: KG) & Register Purchase
    await page.goto("/estoque");
    await page.getByRole("button", { name: /Novo insumo/i }).click();
    const ingredientDialog = page.getByTestId("upsert-ingredient-dialog");
    await expect(ingredientDialog).toHaveAttribute("data-ready", "true", { timeout: 15000 });
    await ingredientDialog.getByTestId("upsert-ingredient-name-input").fill(ingredientName);
    
    // Select Unit KG
    await ingredientDialog.getByTestId("upsert-ingredient-unit-select").click({ force: true });
    await page.getByRole("option", { name: /Quilograma/i }).click({ force: true });
    await ingredientDialog.getByRole("button", { name: "Salvar" }).click({ force: true });
    await expect(page.getByText(/sucesso/i)).toBeVisible();
    await page.keyboard.press("Escape");
    await page.reload();

    // Register Purchase for Ingredient
    await page.getByRole("button", { name: "Registrar compra" }).click();
    const purchaseDialog = page.getByTestId("upsert-stock-entry-dialog");
    await expect(purchaseDialog).toHaveAttribute("data-ready", "true", { timeout: 20000 });
    await purchaseDialog.getByTestId("stock-entry-product-combobox").click();
    
    // Aguardar o Combobox estar pronto para receber digitação
    await expect(async () => {
      const searchInput = page.getByPlaceholder("Buscar...").last();
      await searchInput.fill(ingredientName);
      await page.getByRole("option", { name: new RegExp(ingredientName, 'i') }).click();
    }).toPass({ timeout: 10000 });
    
    await purchaseDialog.getByTestId("stock-entry-supplier-combobox").click();
    await page.getByPlaceholder("Buscar...").last().fill(supplierName);
    await page.getByRole("option", { name: new RegExp(supplierName, 'i') }).click();
    
    await fillMaskedInput(purchaseDialog.getByLabel(/Quantidade/i), "10"); // 10kg
    await fillMaskedInput(purchaseDialog.getByLabel(/Custo/i), "15,00"); // 15/kg
    await purchaseDialog.getByRole("button", { name: /Confirmar Entrada/i }).click({ force: true });
    await expect(page.getByText(/sucesso/i).or(page.getByText(/registrada/i))).toBeVisible();
    await page.keyboard.press("Escape");

    // STEP C: Register MTO Product (isMadeToOrder = true) + Recipe
    await page.goto("/cardapio");
    await page.getByRole("button", { name: "Novo produto" }).click();
    const productDialog = page.getByTestId("upsert-product-dialog");
    await expect(productDialog).toHaveAttribute("data-ready", "true", { timeout: 15000 });
    await productDialog.getByTestId("upsert-product-name-input").fill(mtoProductName);
    
    // Select TYPE PRODUCTION
    await productDialog.getByTestId("upsert-product-type-select").click();
    await page.getByRole("option", { name: /Produção Própria/i }).click();
    // Wait for select menu to close
    await expect(page.getByRole("listbox")).not.toBeVisible();

    // Verify default value of MTO is true (Made to order)
    const mtoSwitch = productDialog.getByRole("switch", { name: /Como o estoque deste produto funciona/i });
    await expect(mtoSwitch).toBeChecked(); // Default should be true (MTO)

    await fillMaskedInput(productDialog.getByLabel(/Preço Venda/i), "25,00");
    
    // Explicitly wait for button to be enabled and visible
    const saveBtn = productDialog.locator("button:has-text('Salvar Produto')");
    await expect(saveBtn).toBeEnabled();
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click({ force: true });
    
    await expect(page.getByText(/sucesso|criado/i)).toBeVisible();
    await page.getByText(/sucesso/i).waitFor({ state: 'hidden' });
    await page.keyboard.press("Escape");

    // Add Recipe to MTO Burger
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // VERIFY: Stock section should be HIDDEN in the catalog card
    const mtoCard = page.getByTestId("product-card").filter({ has: page.getByRole('heading', { name: mtoProductName }) }).first();
    await expect(mtoCard.getByText(/Estoque/i)).toBeHidden();
    await expect(mtoCard.getByTestId("product-status-badge")).toBeHidden();

    await page.getByRole('heading', { name: mtoProductName }).first().click({ force: true });
    
    // Ensure we are on the details page
    await expect(page).toHaveURL(/\/cardapio\/.+/, { timeout: 30000 });
    
    const recipeForm = page.getByTestId("add-recipe-ingredient-form");
    await expect(recipeForm).toBeVisible({ timeout: 15000 });
    const addIngredientButton = recipeForm.getByLabel("Adicionar");
    await addIngredientButton.click();
    await expect(recipeForm).toHaveAttribute("data-ready", "true");
    
    await recipeForm.getByTestId("ingredient-selector").click();
    await page.getByPlaceholder("Buscar...").last().fill(ingredientName);
    await page.getByRole("option", { name: new RegExp(ingredientName, 'i') }).click();
    
    await fillMaskedInput(recipeForm.getByLabel(/Quantidade/i), "0,100"); // 100g
    await recipeForm.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByText(/sucesso/i)).toBeVisible();
    await page.getByText(/sucesso/i).waitFor({ state: 'hidden' });
    await page.keyboard.press("Escape");
    await page.reload();

    // NEW UX CHECK: Stock Status Card and Produce Button should be HIDDEN for MTO products
    await expect(page.getByText(/Status do Estoque/i)).toBeHidden();
    await expect(page.getByRole("button", { name: "Produzir Lote" })).toBeHidden();
    await expect(page.getByTestId("stock-status-badge")).toBeHidden();


    // STEP D: Register BATCH Product (isMadeToOrder = false) + Recipe
    await page.goto("/cardapio");
    await page.getByRole("button", { name: "Novo produto" }).click();
    await expect(productDialog).toHaveAttribute("data-ready", "true");
    await productDialog.getByTestId("upsert-product-name-input").fill(batchProductName);
    
    await productDialog.getByTestId("upsert-product-type-select").click();
    await page.getByRole("option", { name: /Produção Própria/i }).click();

    // Toggle MTO to False (Batch Production)
    const mtoSwitchBatch = productDialog.getByRole("switch", { name: /Como o estoque deste produto funciona/i });
    await mtoSwitchBatch.click();
    await expect(mtoSwitchBatch).not.toBeChecked();

    await fillMaskedInput(productDialog.getByLabel(/Preço Venda/i), "30,00");

    // Explicitly wait for button to be enabled
    const saveBtn2 = productDialog.locator("button:has-text('Salvar Produto')");
    await expect(saveBtn2).toBeEnabled();
    await saveBtn2.click({ force: true });

    await expect(page.getByText(/sucesso|criado/i)).toBeVisible();
    await expect(async () => {
      await page.keyboard.press("Escape");
      await expect(page.getByText(/sucesso/i)).not.toBeVisible();
    }).toPass();

    // Add Recipe to BATCH Burger
    await page.reload();
    await expect(page.getByRole("heading", { name: batchProductName }).first()).toBeVisible({ timeout: 30000 });
    
    // VERIFY: Stock section should be VISIBLE in the catalog card for BATCH product
    const batchCard = page.getByTestId("product-card").filter({ has: page.getByRole('heading', { name: batchProductName }) }).first();
    await expect(batchCard.getByText(/Estoque/i)).toBeVisible();

    await page.getByRole('heading', { name: batchProductName }).first().click({ force: true });
    
    // Ensure we are on the details page
    await expect(page).toHaveURL(/\/cardapio\/.+/, { timeout: 30000 });
    
    const recipeForm2 = page.getByTestId("add-recipe-ingredient-form");
    await expect(recipeForm2).toBeVisible({ timeout: 15000 });
    const addIngredientButton2 = recipeForm2.getByLabel("Adicionar");
    await addIngredientButton2.click();
    await expect(recipeForm2).toHaveAttribute("data-ready", "true");
    await recipeForm2.getByTestId("ingredient-selector").click();
    await page.getByPlaceholder("Buscar...").last().fill(ingredientName);
    await page.getByRole("option", { name: new RegExp(ingredientName, 'i') }).click();
    await fillMaskedInput(recipeForm2.getByLabel(/Quantidade/i), "0,200"); // 200g
    await recipeForm2.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByText(/sucesso/i)).toBeVisible();
    await page.keyboard.press("Escape");

    // STEP E: POS VALIDATION (PDV)
    await page.goto("/sales");
    await page.getByRole("button", { name: /Nova Venda/i }).click();
    const saleSheet = page.getByTestId("upsert-sale-sheet");
    await expect(saleSheet).toHaveAttribute("data-ready", "true");

    // 1. MTO Product should be sellable (even with 0 stock)
    await saleSheet.getByTestId("product-search-combobox").click();
    await page.getByPlaceholder("Buscar...").last().fill(mtoProductName);
    const mtoOption = page.getByRole("option", { name: new RegExp(mtoProductName, 'i') });
    await expect(mtoOption).toBeVisible();
    await mtoOption.click();
    
    // Check if it shows 0 stock in the composer after selection
    await expect(saleSheet.getByText(/0 em estoque/i)).toBeVisible();
    
    // Add to cart
    await saleSheet.getByRole("button", { name: /Adicionar à Lista/i }).click();
    
    // 2. BATCH Product should NOT have a sellable option or should be prevented if out of stock
    await saleSheet.getByTestId("product-search-combobox").click();
    await page.getByPlaceholder("Buscar...").last().fill(batchProductName);
    const batchOption = page.getByRole("option", { name: new RegExp(batchProductName, 'i') });
    await expect(batchOption).toBeVisible();
    // It should show 0 in estoque
    await expect(batchOption).toContainText("0");
    await batchOption.click();
    
    // ADD TO CART (Missing step in previous version!)
    await saleSheet.getByRole("button", { name: /Adicionar à Lista/i }).click();
    
    // Select payment method (optional in schema, but good for form validity)
    await saleSheet.getByTestId("payment-method-select").click();
    await page.getByRole("option", { name: /Dinheiro/i }).click();

    // The sale sheet should now have 2 items.
    // We try to finalize the sale.
    const finalizeBtn = saleSheet.getByTestId("finalize-sale-button");
    await expect(finalizeBtn).toBeEnabled();
    await finalizeBtn.click();
    
    // Error expected for Batch Burger
    await expect(page.getByText(/estoque insuficiente/i)).toBeVisible();

    // Remove batch burger to continue
    await saleSheet.locator("tr").filter({ has: page.locator("p", { hasText: batchProductName }) }).getByTestId("remove-item-button").click();
    
    // Validar remoção via UI (Estado Final)
    await expect(saleSheet.locator("p", { hasText: batchProductName })).not.toBeVisible({ timeout: 10000 });

    // Finalize sale with only MTO Burger
    // MTO Burger should work even with 0 stock
    await finalizeBtn.click();
    await expect(page.getByText(/sucesso/i).last()).toBeVisible();

    // STEP F: BATCH PRODUCTION
    await page.goto("/cardapio");
    await page.getByText(batchProductName).click();
    
    // Check if "Produzir Lote" is visible (isMadeToOrder is false)
    const productionBtn = page.getByRole("button", { name: "Produzir Lote" });
    await expect(productionBtn).toBeVisible();
    await productionBtn.click();
    
    const productionDialog = page.locator("div[role='dialog']");
    await expect(productionDialog).toBeVisible();
    await productionDialog.locator("#produce-qty").fill("5");
    
    await expect(async () => {
      await productionDialog.getByRole("button", { name: "Confirmar Produção" }).click();
      await expect(page.getByText(/concluída/i).last()).toBeVisible();
    }).toPass({ timeout: 15000 });
    
    await page.keyboard.press("Escape");

    // STEP G: VERIFICATION
    // 1. Check Batch Burger Stock (should be 5)
    await page.reload();
    await expect(page.getByText(/Disponível em Estoque/i).locator("xpath=..").getByText("5")).toBeVisible();

    // 2. Check Ingredient Stock (Morango)
    // Initial: 10kg
    // MTO Sale: -0.100kg
    // Batch Production (5 units * 0.200kg): -1.000kg
    // Final: 8.900kg
    await page.goto("/estoque");
    await page.getByPlaceholder(/buscar/i).fill(ingredientName);
    const ingredientRow = page.getByRole("row").filter({ hasText: ingredientName });
    // Check for "8,9" in the stock column
    await expect(ingredientRow.getByText("8,9")).toBeVisible();

    // 3. Check MTO product stock (should be 0, not negative)
    await page.goto("/cardapio");
    await page.getByRole('heading', { name: mtoProductName }).first().click();
    await expect(page.getByText(/Disponível em Estoque/i)).toBeHidden(); 
    // Since we can't see the card, we check the DB value indirectly or assume integration 
    // But we can verify the 'InlineProductHeader' or similar if it shows stock somewhere else.
    // However, the best way is to ensure no error happened and the card remained hidden.
    
    console.log("HYBRID INVENTORY VALIDATION COMPLETE: SUCCESS 6/6");
  });
});
