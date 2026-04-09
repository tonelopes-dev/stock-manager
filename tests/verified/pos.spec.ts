import { test, expect } from "@playwright/test";

test.describe("Point of Sale (POS)", () => {
  test.beforeEach(async ({ page }) => {
    // Sales page is the ultimate stress test
    await page.goto("/vendas", { timeout: 60000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Vendas" })).toBeVisible({ timeout: 40000 });
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
    await page.waitForTimeout(1500);
    const finalizeBtn = page.getByRole("button", { name: /Finalizar R\$/i }).first();
    await expect(finalizeBtn).toBeEnabled();
    await finalizeBtn.click();
    
    await expect(page.getByText(/sucesso/i)).toBeVisible({ timeout: 40000 });
    await page.keyboard.press("Escape");
    
    // 5. Verify in History
    await page.reload();
    await expect(page.getByRole("heading", { name: "Vendas" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: new RegExp(productName, 'i') }).first()).toBeVisible({ timeout: 35000 });
  });
});
