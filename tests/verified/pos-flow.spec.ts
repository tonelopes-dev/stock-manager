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

test.describe("POS Flow & Comanda Management", () => {
    
  test.beforeEach(async ({ page }) => {
    // Collect console logs for debugging
    page.on("console", (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto("/sales");
    // Ensure we are logged in (handled by storageState)
    await expect(page).toHaveURL(/\/sales/);
  });

  test("Cenário A: Venda Avulsa Rápida (Revenda + PIX)", async ({ page }) => {
    // 1. Abrir PDV
    await page.getByRole("button", { name: /Nova Venda/i }).click();
    const saleSheet = page.getByTestId("upsert-sale-sheet");
    await expect(saleSheet).toHaveAttribute("data-ready", "true");

    // 2. Adicionar Item de Revenda (Coca-Cola 350ml)
    await saleSheet.getByTestId("product-search-combobox").click();
    await page.getByRole("dialog").getByPlaceholder("Buscar...").fill("Coca-Cola 350ml");
    await page.getByRole("option", { name: /Coca-Cola 350ml/i }).click();
    
    // Adicionar à lista
    await saleSheet.getByRole("button", { name: /Adicionar à Lista/i }).click();
    
    // 3. Selecionar Forma de Pagamento (PIX)
    await page.getByTestId("payment-method-select").click();
    await page.getByRole("option", { name: "PIX" }).click();
    
    // 4. Finalizar
    await page.getByTestId("finalize-sale-button").click();
    
    // 5. Assert Sucesso
    await expect(page.getByText(/Venda realizada com sucesso/i)).toBeVisible();
    await expect(saleSheet).not.toBeVisible();
  });

  test("Cenário B: Gestão de Comandas (Combo + MTO)", async ({ page }) => {
    const customerName = "Cliente SDET Teste"; // Nome vindo do seed

    // 1. Abrir PDV
    await page.getByRole("button", { name: /Nova Venda/i }).click();
    const saleSheet = page.getByTestId("upsert-sale-sheet");
    await expect(saleSheet).toHaveAttribute("data-ready", "true");

    // 2. Selecionar Cliente
    await saleSheet.getByRole("combobox", { name: /selecione o cliente/i }).click();
    await page.getByRole("dialog").getByPlaceholder("Buscar...").fill(customerName);
    await page.getByRole("option", { name: new RegExp(`^${customerName}$`, "i") }).first().click();

    // 3. Adicionar Combo Burger + Coca
    await saleSheet.getByTestId("product-search-combobox").click();
    await page.getByRole("dialog").getByPlaceholder("Buscar...").fill("Combo Burger + Coca");
    await page.getByRole("option", { name: /Combo Burger \+ Coca/i }).click();
    await saleSheet.getByRole("button", { name: /Adicionar à Lista/i }).click();

    // 4. Adicionar MTO Burger ou Gin Tônica Clássica
    await saleSheet.getByTestId("product-search-combobox").click();
    await page.getByRole("dialog").getByPlaceholder("Buscar...").fill("Gin Tônica Clássica");
    await page.getByRole("option", { name: /Gin Tônica Clássica/i }).click();
    await saleSheet.getByRole("button", { name: /Adicionar à Lista/i }).click();

    // 5. Clicar em Comanda (Não seleciona pagamento)
    await page.getByTestId("open-order-button").click();

    // 6. Assert Sucesso
    await expect(page.getByText(/Comanda \(Pedido\) criada com sucesso/i)).toBeVisible();
    await expect(saleSheet).not.toBeVisible();

    // 7. Verificar no Grid de Comandas (Gestão)
    // No grid, deve aparecer um card com o nome do cliente
    await expect(page.getByTestId("comanda-card").filter({ hasText: customerName }).first()).toBeVisible();
  });

  test("Cenário C: Edge Case - Bloqueio de Lote sem Estoque", async ({ page }) => {
    const batchProduct = "Croissant de Frango"; // Stock 0 no seed

    // 1. Abrir PDV
    await page.getByRole("button", { name: /Nova Venda/i }).click();
    const saleSheet = page.getByTestId("upsert-sale-sheet");
    await expect(saleSheet).toHaveAttribute("data-ready", "true");

    // 2. Tentar Adicionar Produto sem Estoque
    await saleSheet.getByTestId("product-search-combobox").click();
    await page.getByRole("dialog").getByPlaceholder("Buscar...").fill(batchProduct);
    await page.getByRole("option", { name: new RegExp(batchProduct, "i") }).click();

    // Validar aviso visual de estoque 0
    await expect(saleSheet.getByText(/0 em estoque/i)).toBeVisible();
    
    // Adicionar à lista
    await saleSheet.getByRole("button", { name: /Adicionar à Lista/i }).click();

    // 3. Tentar Finalizar (Selecionando PIX para habilitar o botão de finalizar)
    await page.getByTestId("payment-method-select").click();
    await page.getByRole("option", { name: "PIX" }).click();
    await page.getByTestId("finalize-sale-button").click();

    // 4. Esperar erro de estoque insuficiente (Toast vindo da Action)
    await expect(page.getByText(/estoque insuficiente/i)).toBeVisible();
    await expect(saleSheet).toBeVisible(); // Sheet deve permanecer aberto
  });

  test("Cenário D: Registro de Cliente Integrado (CRM)", async ({ page }) => {
    const newCustomerName = `Novo Cliente ${faker.string.uuid().slice(0, 4)}`;
    const newCustomerPhone = "11999999999";

    // 1. Abrir PDV
    await page.getByRole("button", { name: /Nova Venda/i }).click();
    const saleSheet = page.getByTestId("upsert-sale-sheet");
    await expect(saleSheet).toHaveAttribute("data-ready", "true");

    // 2. Clicar em "Novo Cliente"
    await page.getByRole("button", { name: /Novo Cliente/i }).click();
    
    // 3. Preencher Modal de Cliente (Sentinela de Hidratação)
    const customerDialog = page.getByRole("dialog").filter({ hasText: /Novo Cliente/i });
    await expect(customerDialog).toHaveAttribute("data-ready", "true", { timeout: 15000 });

    await customerDialog.getByPlaceholder("Nome do Cliente").fill(newCustomerName);
    await customerDialog.getByPlaceholder(/Telefone/i).fill(newCustomerPhone);
    
    // Salvar Cliente com retry atômico
    await expect(async () => {
      await customerDialog.getByRole("button", { name: "Salvar" }).click();
    }).toPass({ timeout: 10000 });

    // 4. Assert Sucesso e Auto-seleção (Resiliente)
    await expect(page.getByText(/Cliente criado com sucesso/i)).toBeVisible();
    
    // Verificar se o cliente foi selecionado automaticamente no Sheet de Venda
    await expect(async () => {
      const selectedCustomer = saleSheet.getByRole("combobox").filter({ hasText: new RegExp(newCustomerName, "i") });
      await expect(selectedCustomer).toBeVisible();
    }).toPass({ timeout: 10000 });
    
    // 5. Finalizar Venda Rápida para este novo cliente
    await saleSheet.getByTestId("product-search-combobox").click();
    await page.getByRole("dialog").getByPlaceholder("Buscar...").fill("Coca-Cola 350ml");
    await page.getByRole("option", { name: /Coca-Cola 350ml/i }).click();
    await saleSheet.getByRole("button", { name: /Adicionar à Lista/i }).click();
    
    await page.getByTestId("payment-method-select").click();
    await page.getByRole("option", { name: "Dinheiro" }).click();
    await page.getByTestId("finalize-sale-button").click();
    
    await expect(page.getByText(/Venda realizada com sucesso/i)).toBeVisible();
  });
});
