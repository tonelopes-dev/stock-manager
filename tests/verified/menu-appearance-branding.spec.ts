import { test, expect } from "@playwright/test";
import path from "path";

/**
 * Suite de testes para Identidade Visual e Branding
 */
test.describe("Gestão de Cardápio: Identidade Visual", () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto("/menu-management");
    await page.getByRole("tab", { name: /Visual da Loja/i }).click();
  });

  test("Deve simular upload de banner e validar estado de loading", async ({ page }) => {
    // Como o input está escondido dentro de um label, usamos o data-testid que adicionamos
    const fileInput = page.getByTestId("upload-banner-input");
    
    // Mock do upload (Playwright lida com o input type file mesmo oculto)
    await fileInput.setInputFiles(path.join(__dirname, "../../public/logo/logo-kipo.png"));

    // O botão de salvar deve ficar desabilitado durante o processo (que inclui compressão e upload)
    const saveBtn = page.getByTestId("appearance-save-button");
    
    // Verificamos se o estado de loading aparece (SALVANDO...)
    await expect(saveBtn).toContainText(/SALVANDO/i);
    await expect(saveBtn).toBeDisabled();

    // Após o sucesso (auto-save), o toast deve aparecer
    await expect(page.getByText(/enviado com sucesso/i)).toBeVisible();
    await expect(page.getByText(/Informações do menu atualizadas/i)).toBeVisible();
  });

  test("Deve desabilitar inputs ao marcar dia como Fechado", async ({ page }) => {
    // Vamos pegar a Terça-feira (index 1 no array do componente)
    // No nosso componente, os dias são renderizados sequencialmente.
    // Procuramos pelo container da Terça
    const terçaRow = page.locator('div').filter({ hasText: /^Terça/ }).first();
    const closedSwitch = terçaRow.getByRole("switch");
    
    // Pegar inputs de horário da Terça
    const openTimeInput = terçaRow.locator('input[type="time"]').first();
    const closeTimeInput = terçaRow.locator('input[type="time"]').last();

    // 1. Marcar como Fechado
    if (await closedSwitch.getAttribute("data-state") !== "checked") {
      await closedSwitch.click();
    }
    
    // 2. Validar que inputs ficaram disabled
    await expect(openTimeInput).toBeDisabled();
    await expect(closeTimeInput).toBeDisabled();
    await expect(terçaRow.getByText("FECHADO")).toBeVisible();

    // 3. Marcar como Aberto e validar reativação
    await closedSwitch.click();
    await expect(openTimeInput).toBeEnabled();
    await expect(closeTimeInput).toBeEnabled();
    await expect(terçaRow.getByText("ABERTO")).toBeVisible();
  });
});
