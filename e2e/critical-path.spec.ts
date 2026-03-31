import { test, expect } from "@playwright/test";

/**
 * MASTER FLOW E2E: Caminho Crítico do Sistema
 * -------------------------------------------
 * Este teste valida o ciclo de vida completo de um produto e sua integração
 * com o PDV, garantindo que as baixas de estoque e cálculos de taxas funcionem.
 */

test.describe("Master Flow: Ciclo de Vida do Produto e PDV", () => {
  const timestamp = Date.now();
  const productName = `Água E2E ${timestamp}`;
  const comboName = `Combo Master E2E ${timestamp}`;

  test("deve executar a jornada completa: Criação -> Estoque -> Combo -> Venda -> Auditoria", async ({ page }) => {
    // PASSO 1: Criar Produto de Revenda
    await page.goto("/products");
    await page.getByRole("button", { name: /Novo produto/i }).click();
    
    await page.getByLabel("Nome").fill(productName);
    await page.getByLabel("Preço Venda").fill("5,00");
    await page.getByLabel("Estoque Inicial").fill("0");
    // Tipo REVENDA já vem por padrão
    
    await page.getByRole("button", { name: /Salvar Produto/i }).click();
    await expect(page.getByText(/Produto criado com sucesso/i)).toBeVisible();

    // Redirecionar/Acessar Detalhes (Clica no card recém criado)
    await page.getByText(productName).first().click();
    await expect(page.getByRole("heading", { name: productName })).toBeVisible();

    // PASSO 2: Auditoria de Estoque (Inline)
    await page.getByLabel("Editar Estoque").click();
    const stockInput = page.locator('input[type="number"]').first();
    await stockInput.fill("50");
    await page.getByLabel("Salvar").click();
    await expect(page.getByText(/Estoque atualizado/i)).toBeVisible();
    await expect(page.getByText("50", { exact: true })).toBeVisible();

    // PASSO 3: Criar Combo e Compor Ficha Técnica
    await page.goto("/products");
    await page.getByRole("button", { name: /Novo produto/i }).click();
    
    await page.getByLabel("Nome").fill(comboName);
    const typeSelect = page.getByLabel("Tipo de Produto");
    await typeSelect.click();
    await page.getByRole("option", { name: "Combo" }).click();
    
    await page.getByLabel("Preço Venda").fill("50,00");
    await page.getByRole("button", { name: /Salvar Produto/i }).click();
    await expect(page.getByText(/Produto criado com sucesso/i)).toBeVisible();

    // Ir para detalhes do Combo para adicionar o item na ficha técnica
    await expect(page.getByText(comboName)).toBeVisible();
    await page.getByText(comboName).first().click();
    await expect(page.getByText("Ficha Técnica")).toBeVisible();

    // Adicionar "Água E2E" ao combo
    const comboboxTrigger = page.locator('[role="combobox"]').filter({ hasText: /Selecionar item/i });
    await comboboxTrigger.click();
    await page.keyboard.type(productName);
    await page.getByRole("option", { name: productName }).first().click();
    
    await page.getByLabel("Quantidade").fill("1");
    await page.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByText(/Item adicionado com sucesso/i)).toBeVisible();

    // PASSO 4: Venda no PDV com Gorjeta de 10%
    await page.goto("/sales");
    await page.getByRole("button", { name: /Nova Venda/i }).click();
    
    // Aguardar animação do Sheet
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Compor Carrinho/i)).toBeVisible();
    
    // Buscar Combo no PDV usando data-testid
    const pdvCombobox = page.getByTestId("product-search-combobox").first();
    await pdvCombobox.click();
    await page.keyboard.type(comboName);
    await page.getByRole("option", { name: comboName }).first().click();
    await page.getByRole("button", { name: /Adicionar à Lista/i }).click();

    // VALIDAR MATEMÁTICA (R$ 50,00 + 10%)
    await expect(page.getByText(/Resumo Financeiro/i)).toBeVisible();
    await expect(page.getByText("R$ 50,00").first()).toBeVisible();
    
    // Verificar se a gorjeta de 10% está On e o valor da taxa
    await expect(page.locator("#service-charge")).toBeChecked();
    await expect(page.getByText("R$ 5,00").first()).toBeVisible();
    await expect(page.getByText("Total Geral").first()).toBeVisible();
    await expect(page.getByText("R$ 55,00").first()).toBeVisible();

    // Finalizar Venda
    const paymentTrigger = page.getByTestId("payment-method-select");
    await paymentTrigger.click();
    await page.getByRole("option", { name: "Dinheiro" }).click();
    
    await page.getByTestId("finalize-sale-button").click();
    await expect(page.getByText(/Venda realizada com sucesso/i)).toBeVisible();

    // PASSO 5: Conferência de Baixa de Estoque
    await page.goto("/products");
    await page.getByText(productName).first().click();
    
    // O estoque inicial era 50, vendemos 1 combo que consome 1 água -> deve ser 49
    await expect(page.getByText("49", { exact: true })).toBeVisible({ timeout: 10_000 });
  });
});
