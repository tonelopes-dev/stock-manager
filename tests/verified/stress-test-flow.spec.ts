import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { cleanupE2EOrders, disconnect } from "../factories/db-factory";

/**
 * Stress Test Flow — Multi-Persona Real-time Sincronização
 * 
 * Este teste valida se o Supabase Realtime está a funcionar corretamente:
 * 1. Cliente faz um pedido no cardápio público.
 * 2. KDS (Cozinha e Expedição) recebe o pedido INSTANTANEAMENTE sem refresh.
 */
test.describe("Sincronização em Tempo Real (Supabase Realtime)", () => {
  let clientContext: BrowserContext;
  let clientPage: Page;
  let kdsContext: BrowserContext;
  let kdsPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Contexto 1: Cliente (Anônimo)
    clientContext = await browser.newContext();
    clientPage = await clientContext.newPage();

    // Contexto 2: KDS (Autenticado - Reutiliza storageState global)
    kdsContext = await browser.newContext({
      storageState: require('path').join(__dirname, ".auth/user.json"),
    });
    kdsPage = await kdsContext.newPage();
  });

  test.afterAll(async () => {
    await clientContext.close();
    await kdsContext.close();
  });

  test("Deve sincronizar pedido do cliente com o KDS em tempo real", async () => {
    const slug = "e2e-rota-360";

    // 1. KDS: Acessa e garante que o Realtime está conectado
    console.log("KDS: Acessando tela de KDS...");
    await kdsPage.goto("/kds");
    
    // Log URL if check fails
    console.log(`KDS Current URL: ${kdsPage.url()}`);
    if (kdsPage.url().includes("/login")) {
      console.error("❌ Erro: KDS redirecionado para login. StorageState falhou?");
    }

    // Garantir que o Realtime conectou antes de seguir
    await expect(kdsPage.getByText(/REALTIME ATIVO/i)).toBeVisible({ timeout: 15_000 });

    await expect(kdsPage.getByRole("heading", { name: "KDS." })).toBeVisible({ timeout: 20_000 });
    
    // Garantir que estamos na visão correta (ex: Cozinha)
    console.log("KDS: Trocando para aba Cozinha...");
    const cozinhaTab = kdsPage.getByRole("tab", { name: /Cozinha/i });
    await cozinhaTab.click();
    await expect(cozinhaTab).toHaveAttribute("data-state", "active");
    
    // Pequeno delay para garantir que o socket está "quente"
    await kdsPage.waitForTimeout(2000);

    // 2. Cliente acessa o cardápio público
    console.log("Cliente: Acessando cardápio público...");
    await clientPage.goto(`/${slug}`);
    
    // 3. Cliente adiciona um produto ao carrinho
    // Procuramos pelo combo "Combo Burger + Coca"
    console.log("Cliente: Adicionando Combo ao carrinho...");
    await clientPage.locator("div").filter({ hasText: /^Combo Burger \+ Coca/ }).first().click();
    await clientPage.getByTestId("product-details-add-button").click();
    
    // 3. Abrir sacola
    console.log("Cliente: Abrindo sacola...");
    await clientPage.getByTestId("floating-cart-button").click();

    // 4. Preencher identificação na sacola
    console.log("Cliente: Finalizando checkout...");
    await clientPage.getByTestId("checkout-customer-name").fill("Cliente Playwright");
    await clientPage.getByTestId("checkout-table-number").fill("42");
    
    // Clica no botão de finalizar
    const finalizeButton = clientPage.getByTestId("checkout-submit-button");
    await finalizeButton.click();

    // 5. Esperar redirecionamento para página de sucesso/acompanhamento
    console.log("Cliente: Esperando redirecionamento...");
    await clientPage.waitForURL(/\/order\//, { timeout: 15_000 });
    const orderId = clientPage.url().split("/").pop()!;
    console.log(`Cliente: Pedido criado com ID: ${orderId}`);

    // 6. KDS: Verificando recebimento do pedido em tempo real...
    console.log("KDS: Verificando recebimento do pedido em tempo real...");
    // Procuramos pelo card com o ID do pedido OU pelo texto da mesa (mais robusto)
    const orderCard = kdsPage.locator(`[data-testid="kds-card-${orderId}"]`).or(
      kdsPage.locator('[data-testid^="kds-card-"]').filter({ hasText: /MESA 42/i })
    ).first();
    
    await expect(orderCard).toBeVisible({ timeout: 30_000 });
    await expect(orderCard).toContainText(/MESA 42/i);

    // 7. Ação no KDS: Mudar status para "PREPARANDO"
    console.log("KDS: Iniciando preparação...");
    const actionButton = orderCard.getByTestId(`kds-action-button-${orderId}`).or(
      orderCard.locator('button').filter({ hasText: /PREPARAR/i })
    ).first();
    
    await actionButton.click();
    
    // Verifica se o card mudou de cor ou label (indicando progresso)
    // O botão deve mudar de texto para "CONCLUIR"
    await expect(actionButton).toContainText(/CONCLUIR/i, { timeout: 15_000 });
  });
});
