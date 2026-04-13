import { test, expect } from "@playwright/test";

/**
 * Suite de Testes: Dashboard Analytics - Verificação Suprema
 * Estratégia: Atômica Sequencial com Seletores Agnósticos e Sincronização por Transição.
 * Ref: https://playwright.dev/docs/test-assertions#expecttopass
 */

test.describe("Dashboard Analytics - Estabilização Final", () => {
  
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    // Navegação base para o ponto de entrada de inteligência
    await page.goto("/sales?view=inteligencia", { waitUntil: "load", timeout: 60000 });
  });

  test("Fluxo Unificado: Abas, Presets e Calendário (Agnóstico)", async ({ page }) => {
    // --- PASSO 1: Sincronização e Hidratação ---
    // Aguardar o botão "Hoje" como prova de que a visão foi renderizada e hidratada
    const sentinel = page.getByRole("button", { name: "Hoje" });
    await expect(sentinel).toBeVisible({ timeout: 30000 });

    // --- PASSO 2: Alternância de Abas (Validação URL + UI) ---
    await test.step("Validar Alternância de Abas", async () => {
      // Mudar para Gestão
      await page.getByRole("tab", { name: /Gest.o/i }).click();
      await expect(async () => {
        await expect(page).toHaveURL(/view=gestao/);
        // Na visão de gestão, o filtro de período NÃO deve ser renderizado (comprovadamente)
        await expect(page.getByRole("button", { name: "Hoje" })).not.toBeVisible();
      }).toPass({ timeout: 15000 });

      // Voltar para Inteligência
      await page.getByRole("tab", { name: /Intelig.ncia/i }).click();
      await expect(async () => {
        await expect(page).toHaveURL(/view=inteligencia/);
        await expect(page.getByRole("button", { name: "Hoje" })).toBeVisible();
      }).toPass({ timeout: 15000 });
    });

    // --- PASSO 3: Filtros Rápidos (Presets) ---
    await test.step("Validar Filtros Rápidos", async () => {
      // 30 Dias
      await page.getByRole("button", { name: "30 Dias" }).click();
      await expect(page).toHaveURL(/range=30d/);
      
      // Hoje
      await page.getByRole("button", { name: "Hoje" }).click();
      await expect(page).toHaveURL(/range=today/);
    });

    // --- PASSO 4: Filtro Customizado (Calendário Agnóstico) ---
    await test.step("Validar Calendário Customizado", async () => {
      // 1. Localizar Botão (Regex permite encontrar mesmo se já houver um período selecionado)
      const calendarBtn = page.getByRole("button").filter({ 
        hasText: /Selecione|Per.odo/i 
      }).filter({
        has: page.locator("svg")
      });
      
      await expect(calendarBtn).toBeVisible({ timeout: 10000 });
      await calendarBtn.click();
      
      // 2. Aguardar Popover do Radix
      const popper = page.locator("[data-radix-popper-content-wrapper], .rdp");
      await expect(popper.first()).toBeVisible({ timeout: 10000 });

      // 3. Seleção de Range via Locators (Robust Strategy)
      const calendar = page.locator('[role="dialog"], [data-radix-popper-content-wrapper], .rdp').first();
      
      await expect(async () => {
        const getDay = (day: string) => calendar.locator('button').filter({ 
          hasText: new RegExp(`^${day}$`) 
        }).filter({ 
          hasNot: page.locator('.outside, .rdp-day_outside, [data-outside]') 
        }).first();

        const d1 = getDay('1');
        const d10 = getDay('10');

        await d1.click({ timeout: 2000 });
        await page.waitForTimeout(600); // Buffer para o React registrar o início do range
        await d10.click({ timeout: 2000 });
      }).toPass({ timeout: 15000 });

      // 4. Aplicar e Validar
      const applyBtn = page.getByRole("button", { name: /^Filtrar$/i });
      await expect(applyBtn).toBeEnabled({ timeout: 10000 });
      await applyBtn.click({ force: true });

      // Validação final da URL com parâmetros
      await expect(async () => {
        await expect(page).toHaveURL(/range=custom/);
        await expect(page).toHaveURL(/from=\d{4}-\d{2}-01/);
        await expect(page).toHaveURL(/to=\d{4}-\d{2}-10/);
      }).toPass({ timeout: 15000 });
    });
  });
});
