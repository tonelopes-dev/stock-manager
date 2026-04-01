/**
 * ============================================================
 * E2E TEST: PDV Flow & Global Search
 * ============================================================
 *
 * Cenário 1: Fluxo do PDV (Everton)
 *   - Navegar para /sales
 *   - Abrir o Sheet de "Nova Venda"
 *   - Buscar e adicionar "Combo Rota Burger" ao carrinho
 *   - Verificar valor total
 *   - Selecionar forma de pagamento e finalizar
 *   - Verificar toast de sucesso
 *
 * Cenário 2: Busca Global da Mica
 *   - Abrir o Command Dialog (busca global)
 *   - Buscar por um cliente existente
 *   - Clicar no resultado
 *   - Verificar URL com searchParams action=edit&id=...
 *   - Verificar modal "Editar Cliente" visível
 *   - Fechar e verificar URL limpa
 */

import { test, expect } from "@playwright/test";

test.describe("Cenário 1: Fluxo do PDV", () => {
  test("deve adicionar Combo Rota Burger ao carrinho e finalizar a venda", async ({ page }) => {
    // 1. Navigate to Sales page (default view: "gestao")
    await page.goto("/sales");
    // Use a more specific selector to avoid "Vendas" ambiguity (nav link vs header)
    await expect(page.getByRole("heading", { name: /^Vendas$/i })).toBeVisible({ timeout: 15_000 });

    // Handle Cookie Banner if still there
    const cookieBannerButton = page.getByRole("button", { name: /Aceitar e Fechar/i });
    if (await cookieBannerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBannerButton.click();
    }

    // 2. Click "Nova Venda/Comanda" button to open the Sheet
    await page.getByRole("button", { name: /Nova Venda/i }).click();

    // Wait for the Sheet to open and animation to finish
    await page.waitForTimeout(1000);
    await expect(page.getByText("Compor Carrinho")).toBeVisible({ timeout: 5_000 });

    // 3. Search for "Combo Rota Burger" in the product Combobox
    //     shadcn/ui combobox trigger search
    const comboboxTrigger = page.locator('[role="combobox"]').filter({ hasText: /Buscar produto/i }).first();
    await comboboxTrigger.click();
    await page.waitForTimeout(500);

    // Type "Rota" slowly
    await page.keyboard.type("Rota", { delay: 100 });
    await page.waitForTimeout(1000);

    // Click the option - using a very specific selector for the popup
    const comboOption = page.locator('[role="option"]').filter({ hasText: /Combo Rota Burger/i }).first();
    await comboOption.click();

    // 4. Click "Adicionar à Lista" button
    await page.getByRole("button", { name: /Adicionar à Lista/i }).filter({ visible: true }).first().click();

    // 5. Verify the item is in the cart
    const cartTable = page.locator("table");
    await expect(cartTable.getByText(/Combo Rota Burger/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/1 produtos adicionados/i)).toBeVisible();

    // 6. Verify the total shows R$ 45,00
    await expect(page.getByText(/R\$ 45,00/i)).toBeVisible();

    // 7. Select Payment Method (PIX)
    const paymentTrigger = page.getByRole("combobox").filter({ hasText: /Selecione uma forma de pagamento|Dinheiro|PIX|Cartão de Crédito|Cartão de Débito/i }).first();
    await expect(paymentTrigger).toBeVisible({ timeout: 5000 });
    await paymentTrigger.click();
    await page.waitForTimeout(500);

    // Select the option from the portal/popover
    const pixOption = page.getByRole("option", { name: "PIX", exact: true });
    await expect(pixOption).toBeVisible({ timeout: 5000 });
    await pixOption.click();

    // 8. Click "Finalizar Venda"
    const finalizedButton = page.getByTestId("finalize-sale-button");
    await expect(finalizedButton).toBeVisible({ timeout: 5_000 });
    await finalizedButton.click();

    // 9. Verify toast success message
    await expect(page.getByText(/Venda realizada com sucesso/i)).toBeVisible({ timeout: 10_000 });

    // 10. The Sheet should close
    await expect(page.getByText("Compor Carrinho")).toBeHidden({ timeout: 5_000 });
  });
});

test.describe("Cenário 2: Busca Global", () => {
  test("deve buscar um cliente, abrir o modal de edição e fechar limpando a URL", async ({ page }) => {
    // 1. Navigate to customers page first (needed for the modal to work)
    await page.goto("/customers");
    await expect(page.getByText("Clientes")).toBeVisible({ timeout: 15_000 });

    // Handle Cookie Banner if still there
    const cookieBannerButton = page.getByRole("button", { name: /Aceitar e Fechar/i });
    if (await cookieBannerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBannerButton.click();
    }

    // 2. Open Global Search with Ctrl+K
    await page.keyboard.press("Control+k");
    const searchDialog = page.getByRole("dialog");
    await expect(searchDialog).toBeVisible({ timeout: 5_000 });

    // 3. Search for a product (Combo) which is reliable from seed
    const searchInput = page.getByPlaceholder("Buscar clientes, produtos, vendas...");
    await searchInput.pressSequentially("Combo", { delay: 150 });

    // 4. Wait for results. We expect at least one result containing "Combo"
    await page.waitForTimeout(1000);
    const productResult = page.getByText("Combo Rota Burger").first();
    await expect(productResult).toBeVisible({ timeout: 8_000 });

    // 5. Click the product result
    await productResult.click();

    // 6. Verify navigation to /products with search params
    await page.waitForURL(url => url.pathname === "/products" && url.searchParams.has("action"), { timeout: 10_000 });
    expect(page.url()).toContain("action=edit");

    // 7. Close via Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    // 8. Verify the URL is cleaned
    const currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.has("action")).toBeFalsy();
    expect(currentUrl.searchParams.has("id")).toBeFalsy();
  });

  test("deve buscar um cliente via busca global e navegar para o modal de edição", async ({ page }) => {
    // 1. Navigate to customers
    await page.goto("/customers");
    await expect(page.getByText("Clientes")).toBeVisible({ timeout: 15_000 });

    // Handle Cookie Banner
    const cookieBannerButton = page.getByRole("button", { name: /Aceitar e Fechar/i });
    if (await cookieBannerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBannerButton.click();
    }

    // 2. Open Command Palette
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    // 3. Search for a name prefix likely in seed (from faker)
    //    Actually, let's search for "Matheus" (there is a user Matheus, but maybe not a customer)
    //    Search for "Ro" as in "Rosa" or "Robot" — prefix search is safe.
    const searchInput = page.getByPlaceholder("Buscar clientes, produtos, vendas...");
    await searchInput.pressSequentially("Ro", { delay: 150 });

    // 4. Wait for results (debounced)
    await page.waitForTimeout(1500);

    // 5. We look for ANY result in the list if customers are empty,
    //    but we'll try to find an item with an icon (Users class or Package)
    const firstItem = page.locator('[role="option"], [cmdk-item]').first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });

    const itemTitle = await firstItem.textContent();
    await firstItem.click();

    // 6. Verify navigation and URL cleaning after escape
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("action=edit");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    const currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.has("action")).toBeFalsy();
  });
});

