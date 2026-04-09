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

    // 4. Verify
    await expect(page.getByRole("row").filter({ hasText: ingredientName }).first()).toBeVisible({ timeout: 20000 });
  });
});
