import { test, expect } from "@playwright/test";
import { fakerPT_BR as faker } from "@faker-js/faker";

test.describe("Catalog & Technical Sheet", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cardapio");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Cardápio" })).toBeVisible({ timeout: 30000 });
  });

  test("should create a product and link an ingredient (Technical Sheet)", async ({ page }) => {
    const uuid = faker.string.uuid().slice(0, 8);
    const ingredientName = `Insumo Ficha ${uuid}`;
    const productName = `Produto Produção ${uuid}`;

    // 1. Create an ingredient
    await page.goto("/estoque");
    await page.getByRole("button", { name: /Novo insumo/i }).click();
    const ingDialog = page.getByTestId("upsert-ingredient-dialog");
    await expect(ingDialog).toHaveAttribute("data-ready", "true", { timeout: 20000 });
    await ingDialog.getByTestId("upsert-ingredient-name-input").fill(ingredientName);
    await ingDialog.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(/sucesso/i)).toBeVisible();
    await page.keyboard.press("Escape");
    
    // NUCLEAR SYNC
    await page.reload();
    await page.getByPlaceholder(/Buscar/i).fill(ingredientName);
    await expect(page.getByRole("row").filter({ hasText: ingredientName }).first()).toBeVisible();

    // 2. Catalog - Create Product
    await page.goto("/cardapio");
    await page.getByRole("button", { name: /Novo produto/i }).click();
    const productDialog = page.getByTestId("upsert-product-dialog");
    await expect(productDialog).toHaveAttribute("data-ready", "true", { timeout: 20000 });
    
    // NUCLEAR HYDRATION WAIT
    await page.waitForTimeout(2000);
    
    await productDialog.getByTestId("upsert-product-name-input").fill(productName);
    
    // Select Category (Fallthrough Selection)
    // Try testid first, then placeholder
    const catTrigger = page.getByTestId("category-select-trigger").or(page.getByRole("combobox").filter({ hasText: /Selecione.../i }));
    await expect(catTrigger.first()).toBeVisible({ timeout: 20000 });
    await catTrigger.first().click({ force: true });
    
    await expect(page.getByRole("option").first()).toBeVisible({ timeout: 15000 });
    await page.getByRole("option").first().click();
    
    // Select Type: Produção Própria
    await page.getByRole("combobox").filter({ hasText: /Revenda/i }).first().click({ force: true });
    await expect(page.getByRole("option", { name: /Produção Própria/i })).toBeVisible();
    await page.getByRole("option", { name: /Produção Própria/i }).click();
    
    await productDialog.getByLabel(/Preço/i).fill("50,00");
    await page.waitForTimeout(1000); 
    await productDialog.getByRole("button", { name: "Salvar Produto" }).click();
    await expect(page.getByText(/Produto criado/i)).toBeVisible({ timeout: 30000 });
    await page.keyboard.press("Escape");
    
    // NUCLEAR SYNC
    await page.reload();
    await page.getByPlaceholder(/Buscar/i).fill(productName);
    const productHeading = page.getByRole("heading", { name: productName });
    await expect(productHeading).toBeVisible({ timeout: 25000 });
    await productHeading.click();
    await page.waitForURL(/\/cardapio\/.+/);
    
    // 3. Technical Sheet
    await page.waitForTimeout(2000);
    const recipeForm = page.getByTestId("add-recipe-ingredient-form");
    await expect(recipeForm).toHaveAttribute("data-ready", "true", { timeout: 20000 });
    
    // Ingredient selection
    await recipeForm.getByTestId("ingredient-selector").click({ force: true });
    await page.getByPlaceholder(/item/i).fill(ingredientName);
    await expect(page.getByRole("option", { name: new RegExp(ingredientName, 'i') })).toBeVisible();
    await page.getByRole("option", { name: new RegExp(ingredientName, 'i') }).click();
    
    await recipeForm.getByLabel(/Quantidade/i).fill("0.250");
    
    // Unidade selection
    await page.getByRole("combobox").filter({ hasText: /Un\./i }).first().click();
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.getByRole("option").first().click();
    
    await page.waitForTimeout(1000);
    await recipeForm.getByRole("button").filter({ has: page.locator("svg.lucide-plus") }).click();

    // 4. Verify Immediate Sync
    await expect(page.getByRole("row").filter({ hasText: ingredientName }).first()).toBeVisible({ timeout: 20000 });
    
    // 5. Verify Financial Summary (Real-time Sync)
    // The cost should be exactly the partial cost in the table
    // Ingredient was created with default 0 cost? No, the action might have 0.
    // Let's create a specific test for normalization below.
  });

  test("should calculate costs correctly when using different unit scales (normalization)", async ({ page }) => {
    const uuid = faker.string.uuid().slice(0, 8);
    const ingredientName = `Ingrediente KG ${uuid}`;
    const productName = `Produto Produção Calc ${uuid}`;

    // 1. Create a KG ingredient with cost
    await page.goto("/estoque");
    await page.getByRole("button", { name: /Novo insumo/i }).click();
    const ingDialog = page.getByTestId("upsert-ingredient-dialog");
    await expect(ingDialog).toHaveAttribute("data-ready", "true", { timeout: 20000 });
    await ingDialog.getByTestId("upsert-ingredient-name-input").fill(ingredientName);
    
    // Select KG unit
    await page.getByRole("combobox").filter({ hasText: /Unidades/i }).click();
    await page.getByRole("option", { name: "Kg" }).click();
    
    // Set cost R$ 10,00
    await ingDialog.getByLabel(/Custo Unit/i).fill("10,00");
    await ingDialog.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(/sucesso/i)).toBeVisible();

    // 2. Create Product (Produção Própria)
    await page.goto("/cardapio");
    await page.getByRole("button", { name: /Novo produto/i }).click();
    const productDialog = page.getByTestId("upsert-product-dialog");
    await expect(productDialog).toHaveAttribute("data-ready", "true");
    await productDialog.getByTestId("upsert-product-name-input").fill(productName);
    
    // Select Type: Produção Própria
    await page.getByRole("combobox").filter({ hasText: /Revenda/i }).first().click();
    await page.getByRole("option", { name: /Produção Própria/i }).click();
    
    await productDialog.getByLabel(/Preço/i).fill("100,00");
    await productDialog.getByRole("button", { name: "Salvar Produto" }).click();
    await expect(page.getByText(/Produto criado/i)).toBeVisible();

    // 3. Add 500g and Verify Normalization
    await page.reload();
    await page.getByPlaceholder(/Buscar/i).fill(productName);
    await page.getByRole("heading", { name: productName }).click();
    
    const recipeForm = page.getByTestId("add-recipe-ingredient-form");
    await expect(recipeForm).toHaveAttribute("data-ready", "true");
    
    // Select ingredient
    await recipeForm.getByTestId("ingredient-selector").click();
    await page.getByPlaceholder(/item/i).fill(ingredientName);
    await page.getByRole("option", { name: new RegExp(ingredientName, 'i') }).click();
    
    // Fill 500 and select 'g'
    await recipeForm.getByLabel(/Quantidade/i).fill("500");
    await page.getByRole("combobox").filter({ hasText: /Kg/i }).last().click();
    await page.getByRole("option", { name: "g" }).click();
    
    await recipeForm.getByRole("button").filter({ has: page.locator("svg.lucide-plus") }).click();

    // ASSERTION: 500g of R$ 10,00/KG should be R$ 5,00
    // Check Financial Summary Cards (using more robust selectors)
    const insumosCard = page.locator('div, p').filter({ hasText: /^Insumos$/ }).locator('..').locator('p.text-2xl, p.font-black').first();
    await expect(insumosCard).toContainText("R$ 5,00", { timeout: 15000 });
    
    // Check Total Cost card
    const totalCostCard = page.locator('div, p').filter({ hasText: /^Custo Total$/ }).locator('..').locator('p.text-2xl, p.font-black').first();
    await expect(totalCostCard).toContainText("R$ 5,00");

    // 4. Remove ingredient and verify reset (Trava de Reset)
    // Find the row with the ingredient and click its delete button
    const row = page.getByRole("row").filter({ hasText: ingredientName }).first();
    await row.locator('button').filter({ has: page.locator('svg.lucide-trash, svg.lucide-trash-2') }).click();
    await page.getByRole("button", { name: /Remover/i }).click();
    
    // ASSERTION: Should return to R$ 0,00 immediately
    await expect(insumosCard).toContainText("R$ 0,00", { timeout: 15000 });
  });
});
