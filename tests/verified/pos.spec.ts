import { test, expect } from "@playwright/test";

test.describe("Point of Sale (POS)", () => {
  test.beforeEach(async ({ page }) => {
    // Collect console logs for debugging
    page.on("console", (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    
    // Sales page is the ultimate stress test
    await page.goto("/sales", { timeout: 60000 });
    await page.keyboard.press("Escape");
    // Flexible heading check
    await expect(page.getByRole("heading", { name: /Vendas/i }).first()).toBeVisible({ timeout: 40000 });
  });

  test("should register a sale and verify read-only history", async ({ page }) => {
    // 1. Open New Sale Sheet
    await page.getByRole("button", { name: "Nova Venda" }).click();
    const sheet = page.getByTestId("upsert-sale-sheet");
    await expect(sheet).toHaveAttribute("data-ready", "true", { timeout: 25000 });
    
    // NUCLEAR HYDRATION WAIT
    await page.waitForTimeout(2000);
    
    // 2. Select product (Fallthrough Selector)
    // Try testid first, then role
    const productCombobox = page.getByTestId("product-search-combobox").or(page.getByRole("combobox").filter({ hasText: /Buscar/i }));
    await expect(productCombobox.first()).toBeVisible({ timeout: 20000 });
    await productCombobox.first().click({ force: true });
    
    const firstOption = page.getByRole("option").first();
    await expect(firstOption).toBeVisible({ timeout: 25000 });
    const productName = await firstOption.innerText();
    await firstOption.click();
    
    // Add to cart
    await page.waitForTimeout(1000);
    await page.getByRole("button").filter({ has: page.locator("svg.lucide-plus") }).first().click();
    
    // 3. Verify item in cart
    await expect(page.getByText(new RegExp(productName, 'i'))).toBeVisible({ timeout: 20000 });
    
    // Select Payment Method
    await page.getByRole("combobox").filter({ hasText: /Forma de Pagamento/i }).first().click({ force: true });
    await expect(page.getByRole("option").first()).toBeVisible({ timeout: 15000 });
    await page.getByRole("option").first().click();
    
    // 4. Complete sale
    await page.waitForTimeout(2000);
    const finalizeBtn = page.getByRole("button", { name: /Finalizar R\$/i }).first();
    await expect(finalizeBtn).toBeEnabled({ timeout: 15000 });
    await finalizeBtn.click({ force: true });
    
    await expect(page.getByText(/sucesso/i).or(page.getByText(/registrada/i))).toBeVisible({ timeout: 60000 });
    await page.keyboard.press("Escape");
    
    // 5. Verify in History
    await page.reload();
    await expect(page.getByRole("heading", { name: "Vendas" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: new RegExp(productName, 'i') }).first()).toBeVisible({ timeout: 35000 });
  });

  test("should correctly deduct stock of ingredients for a composed product sale", async ({ page }) => {
    // 1. Get initial stock of an ingredient (e.g., Pão de Hambúrguer)
    await page.goto("/estoque");
    await expect(page.getByRole("heading", { name: "Controle de Estoque" })).toBeVisible();
    
    // Search for the ingredient
    const searchInput = page.getByPlaceholder(/Buscar por nome/i);
    await searchInput.fill("Pão de Hambúrguer");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000); // Wait for filter

    const ingredientRow = page.getByRole("row").filter({ hasText: /Pão de Hambúrguer/i }).first();
    await expect(ingredientRow).toBeVisible();
    
    // Getting stock value (Cell 3 is Estoque)
    const initialStockText = await ingredientRow.locator("td").nth(2).innerText();
    const initialStock = parseFloat(initialStockText.replace(/[^\d.,]/g, "").replace(",", "."));
    console.log(`Initial stock of Pão: ${initialStock}`);

    // 2. Perform a sale of the product using this ingredient
    await page.goto("/sales");
    await page.getByRole("button", { name: "Nova Venda" }).click();
    
    const productCombobox = page.getByTestId("product-search-combobox").or(page.getByRole("combobox").filter({ hasText: /Buscar/i }));
    await productCombobox.first().click();
    await page.getByRole("option", { name: /Hambúrguer Rota Burger/i }).first().click();
    
    // Add to cart
    await page.getByRole("button").filter({ has: page.locator("svg.lucide-plus") }).first().click();
    
    // Select Payment Method
    await page.getByRole("combobox").filter({ hasText: /Forma de Pagamento/i }).first().click();
    await page.getByRole("option", { name: /Dinheiro/i }).or(page.getByRole("option").first()).click();
    
    // Finalize
    const finalizeBtn = page.getByRole("button", { name: /Finalizar R\$/i }).first();
    await finalizeBtn.click({ force: true });
    await expect(page.getByText(/sucesso/i).or(page.getByText(/registrada/i))).toBeVisible({ timeout: 60000 });
    
    // 3. Verify stock deduction
    await page.goto("/estoque");
    await searchInput.fill("Pão de Hambúrguer");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);
    
    const finalStockText = await ingredientRow.locator("td").nth(2).innerText();
    const finalStock = parseFloat(finalStockText.replace(/[^\d.,]/g, "").replace(",", "."));
    console.log(`Final stock of Pão: ${finalStock}`);

    // Assertion: Pão de Hambúrguer uses 1 unit per burger as per seed.ts
    // Using a more flexible assertion for floats
    expect(finalStock).toBeCloseTo(initialStock - 1, 3);
  });
});
