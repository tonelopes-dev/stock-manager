import { test, expect } from "@playwright/test";
import { cleanupE2EOrders, disconnect } from "../factories/db-factory";

/**
 * Rage Click Defense Test
 * 
 * Este teste valida se a UI está protegida contra múltiplos cliques rápidos:
 * 1. O botão deve ficar `disabled` no primeiro clique.
 * 2. Apenas um pedido deve ser criado na base de dados.
 */
test.describe("Defesa contra Rage Clicks", () => {
  const slug = "e2e-rota-360";

  test.beforeAll(async () => {
    try {
      await cleanupE2EOrders();
    } finally {
      await disconnect();
    }
  });

  test("Deve ignorar múltiplos cliques rápidos no checkout e criar apenas 1 pedido", async ({ page }) => {
    // 1. Acessa o cardápio público
    await page.goto(`/${slug}`);

    // 2. Adiciona um produto ao carrinho
    const productCard = page.locator("div").filter({ hasText: /^Coca-Cola 350ml/ }).first();
    await productCard.click();
    
    const addButton = page.getByRole("button", { name: /Adicionar/i });
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // 3. Abre o checkout
    await page.getByTestId("floating-cart-button").click();
    await page.getByTestId("checkout-customer-name").fill("Rage Clicker");
    await page.getByTestId("checkout-table-number").fill("99");

    const finalizeButton = page.getByTestId("checkout-submit-button");

    // 4. RAGE CLICK: Dispara 10 cliques o mais rápido possível
    console.log("🔥 Disparando 10 cliques rápidos...");
    
    // Usamos um loop sem await no click para simular concorrência máxima do lado do cliente
    // Mas o primeiro clique deve disparar a Server Action e desabilitar o botão
    const clicks = Array.from({ length: 10 }).map(() => finalizeButton.click({ delay: 50 }));
    await Promise.all(clicks).catch(() => {}); // Alguns cliques podem falhar se o botão sumir/desabilitar

    // 5. Verificações
    // a. O botão deve estar desabilitado
    await expect(finalizeButton).toBeDisabled();

    // b. Deve aparecer apenas um toast de sucesso (esperamos o texto aparecer)
    await expect(page.getByText(/Pedido realizado com sucesso/i)).toBeVisible();

    // c. Verificação de Idempotência: Navegamos para "Meus Pedidos" e contamos
    // Nota: O caminho pode ser /[slug]/my-orders ou similar. 
    // Vamos tentar localizar o link no menu ou navegar direto.
    console.log("Verificando contagem de pedidos...");
    await page.goto(`/${slug}/my-orders`);
    
    // Esperamos a lista carregar
    await page.waitForSelector("main");
    
    // Contamos quantos cards de pedido existem (pela mesa ou nome)
    const orderCards = page.locator("div").filter({ hasText: "Mesa 99" });
    
    // IMPORTANTE: Deve haver exatamente 1
    await expect(orderCards).toHaveCount(1, { timeout: 10_000 });
  });
});
