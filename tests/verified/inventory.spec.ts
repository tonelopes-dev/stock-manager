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
}

test.describe("Inventory Management", () => {
  test.beforeEach(async ({ page }) => {
    // Collect console logs for debugging
    page.on("console", (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    
    await page.goto("/estoque");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: /Controle de Estoque/i })).toBeVisible({ timeout: 20000 });
  });

  test("should create a new supplier", async ({ page }) => {
    const uuid = faker.string.uuid().slice(0, 8);
    const supplierName = `Fornecedor E2E ${uuid}`;
    
    await page.goto("/fornecedores");
    await page.getByRole("button", { name: "Novo fornecedor" }).click();
    
    const dialog = page.getByTestId("upsert-supplier-dialog");
    await expect(dialog).toHaveAttribute("data-ready", "true", { timeout: 15000 });
    
    await dialog.getByTestId("upsert-supplier-name-input").fill(supplierName);
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(/sucesso/i)).toBeVisible();
    await page.keyboard.press("Escape");

    await page.reload();
    await expect(page.getByText(supplierName)).toBeVisible({ timeout: 15000 });
  });

  test("should create a new ingredient with correct UoM", async ({ page }) => {
    const uuid = faker.string.uuid().slice(0, 8);
    const ingredientName = `Insumo E2E ${uuid}`;
    
    await page.goto("/estoque");
    await page.getByRole("button", { name: /Novo insumo/i }).click();
    const dialog = page.getByTestId("upsert-ingredient-dialog");
    await expect(dialog).toHaveAttribute("data-ready", "true", { timeout: 15000 });
    
    await dialog.getByTestId("upsert-ingredient-name-input").fill(ingredientName);
    
    // Select Unit
    await dialog.getByTestId("upsert-ingredient-unit-select").click({ force: true });
    const option = page.getByRole("option", { name: /Quilograma/i });
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click({ force: true });
    
    await dialog.getByRole("button", { name: "Salvar" }).click({ force: true });
    
    // Wait for the toast or dialog to close
    await expect(page.getByText(/sucesso/i)).toBeVisible({ timeout: 25000 });
    await page.keyboard.press("Escape");
    
    await page.reload();
    await page.getByPlaceholder(/Buscar/i).fill(ingredientName);
    await expect(page.getByRole("row").filter({ hasText: ingredientName }).first()).toBeVisible();
  });

  test("should register a purchase (stock entry) and update unit cost", async ({ page }) => {
    const uuid = faker.string.uuid().slice(0, 8);
    const supplierName = `Support Supplier ${uuid}`;
    const ingredientName = `Support Insumo ${uuid}`;
    const newCost = "15.50";
    
    // 1. Create Supplier
    await page.goto("/fornecedores");
    await page.getByRole("button", { name: "Novo fornecedor" }).click();
    await page.getByTestId("upsert-supplier-name-input").fill(supplierName);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(/sucesso/i)).toBeVisible();
    await page.keyboard.press("Escape");

    // 2. Create Ingredient
    await page.goto("/estoque");
    await page.getByRole("button", { name: /Novo insumo/i }).click();
    await page.getByTestId("upsert-ingredient-name-input").fill(ingredientName);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(/sucesso/i)).toBeVisible();
    await page.keyboard.press("Escape");
    
    // 3. NUCLEAR SYNC
    await page.reload();
    await page.getByPlaceholder(/Buscar/i).fill(ingredientName);
    await expect(page.getByRole("row").filter({ hasText: ingredientName }).first()).toBeVisible();

    // 4. Register purchase
    await page.getByRole("button", { name: "Registrar compra" }).click();
    const dialog = page.getByTestId("upsert-stock-entry-dialog");
    await expect(dialog).toHaveAttribute("data-ready", "true", { timeout: 20000 });
    
    // NUCLEAR HYDRATION WAIT
    await page.waitForTimeout(2000);
    
    await dialog.getByTestId("stock-entry-product-combobox").click();
    await page.getByPlaceholder(/insumo/i).first().fill(ingredientName);
    await expect(page.getByRole("option", { name: new RegExp(ingredientName, 'i') })).toBeVisible();
    await page.getByRole("option", { name: new RegExp(ingredientName, 'i') }).click();
    
    await dialog.getByTestId("stock-entry-supplier-combobox").click();
    await page.getByPlaceholder(/fornecedor/i).first().fill(supplierName);
    await expect(page.getByRole("option", { name: new RegExp(supplierName, 'i') })).toBeVisible();
    await page.getByRole("option", { name: new RegExp(supplierName, 'i') }).click();
    
    await fillMaskedInput(dialog.getByLabel(/Quantidade/i), "10");
    await fillMaskedInput(dialog.getByLabel(/Custo/i), "15,50");
    
    const confirmBtn = dialog.getByRole("button", { name: /Confirmar Entrada/i });
    
    // Validar transação via UI (Estado Final) com retry atômico
    await expect(async () => {
      await confirmBtn.click({ force: true });
      await expect(page.getByText(/registrada/i).or(page.getByText(/sucesso/i))).toBeVisible();
    }).toPass({ timeout: 15000 });

    await page.keyboard.press("Escape");
    
    await page.reload();
    await page.getByPlaceholder(/Buscar/i).fill(ingredientName);
    await expect(page.getByRole("row").filter({ hasText: ingredientName }).first()).toBeVisible();
    // Use Regex to be resilient to formatting
    await expect(page.getByRole("row").filter({ hasText: ingredientName }).getByText(/R\$.*15,50/)).toBeVisible();
  });
});
