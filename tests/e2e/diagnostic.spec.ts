import { test, expect } from "@playwright/test";

test("dom audit", async ({ page }) => {
  await page.goto("http://localhost:3000/estoque");
  await page.getByRole("button", { name: "Novo insumo" }).click();
  
  // Wait for dialog
  await expect(page.getByRole("dialog")).toBeVisible();
  
  // List all elements with the specific ID and their tags
  const audit = await page.evaluate(() => {
    const els = document.querySelectorAll('[id="ingredient-name-input"]');
    return Array.from(els).map(el => ({
      tagName: el.tagName,
      className: el.className,
      id: el.id,
      outerHTML: el.outerHTML.substring(0, 100)
    }));
  });
  
  console.log("DOM AUDIT:", JSON.stringify(audit, null, 2));
  
  // Also check for the placeholder
  const placeholders = await page.evaluate(() => {
    const els = document.querySelectorAll('[placeholder*="Carne bovina"]');
    return Array.from(els).map(el => ({
      tagName: el.tagName,
      id: el.id,
      className: el.className
    }));
  });
  
  console.log("PLACEHOLDERS AUDIT:", JSON.stringify(placeholders, null, 2));
});
