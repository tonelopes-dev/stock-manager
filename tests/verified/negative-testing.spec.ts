import { test, expect } from "@playwright/test";
import { cleanupE2EOrders, disconnect } from "../factories/db-factory";

/**
 * Negative Testing Spec
 * 
 * Valida comportamentos de erro, validações de formulário e restrições de integridade.
 */
test.describe("Testes Negativos e Validações", () => {
  
  test.beforeAll(async () => {
    try {
      await cleanupE2EOrders();
    } finally {
      await disconnect();
    }
  });

  test("Deve validar campos obrigatórios no cadastro de fornecedores", async ({ page }) => {
    await page.goto("/fornecedores");
    
    // Abre modal de criação
    await page.getByRole("button", { name: /Adicionar Fornecedor/i }).click();
    
    // Tenta salvar com nome vazio
    const saveButton = page.getByRole("button", { name: "Salvar" });
    await saveButton.click();
    
    // Verifica se aparece mensagem de erro do Zod/Validation (geralmente abaixo do input)
    // Ou se o botão continua lá e não fechou o modal
    await expect(page.getByText(/Nome é obrigatório/i)).toBeVisible();
  });

  test("Deve impedir preços negativos no cadastro de produtos", async ({ page }) => {
    await page.goto("/cardapio");
    
    // Abre modal de criação
    await page.getByRole("button", { name: /Adicionar Produto/i }).click();
    
    // Preenche preço negativo
    const priceInput = page.locator('input[name="price"]');
    await priceInput.fill("-10");
    
    // Tenta salvar
    await page.getByRole("button", { name: "Adicionar" }).click();
    
    // Verifica erro de validação (Zod: .min(0))
    // Dependendo da implementação, pode ser um toast ou mensagem no campo
    await expect(page.locator("form")).toContainText(/preço/i);
    await expect(page.getByText(/inválido/i).or(page.getByText(/mínimo/i))).toBeVisible();
  });

  test("Deve impedir a exclusão de um produto que possui pedidos vinculados", async ({ page }) => {
    // 1. Primeiro, garantimos que existe um pedido para o produto "Hambúrguer Caseiro"
    // Podemos fazer isso via UI ou assumir que o stress test anterior criou.
    // Para isolamento, vamos criar um pedido rápido via UI aqui.
    const slug = "e2e-rota-360";
    await page.goto(`/${slug}`);
    await page.locator("div").filter({ hasText: /^Hambúrguer Caseiro/ }).first().click();
    
    const addButton = page.getByRole("button", { name: /Adicionar/i });
    if (await addButton.isVisible()) await addButton.click();
    
    await page.getByTestId("floating-cart-button").click();
    await page.getByTestId("checkout-customer-name").fill("Teste Exclusão");
    await page.getByTestId("checkout-submit-button").click();
    await expect(page.getByText(/sucesso/i)).toBeVisible();

    // 2. Tenta deletar o produto na área administrativa
    await page.goto("/cardapio");
    
    // Localiza o produto na tabela e abre o dropdown de ações
    const productRow = page.getByRole("row", { name: /Hambúrguer Caseiro/i });
    await productRow.getByRole("button", { name: /abrir menu/i }).click();
    
    // Clica em excluir
    await page.getByRole("menuitem", { name: /excluir/i }).click();
    
    // Confirma no AlertDialog
    await page.getByTestId("delete-product-confirm").click();
    
    // 3. Verificação: Deve mostrar um toast de erro (Foreign Key constraint)
    // O Prisma/Postgres vai impedir a deleção por causa dos OrderItems
    await expect(page.getByText(/erro/i).or(page.getByText(/vinculado/i))).toBeVisible({ timeout: 10_000 });
    
    // O produto deve continuar visível na tabela
    await expect(productRow).toBeVisible();
  });
});
