# Plano de Implementação: Correção de Insumos e Estabilização E2E

Este plano descreve as correções necessárias para restaurar a funcionalidade da página de Insumos (quebrou após a deleção da tabela `Ingredient`) e para estabilizar o teste E2E do PDV.

## User Review Required

> [!IMPORTANT]
> **Unificação de Tipos:** Em `get-ingredients.ts`, passaremos a tratar o objeto retornado do banco como um `Product`. A interface `IngredientDto` será mantida para compatibilidade com a UI, mas os dados virão da tabela `Product` filtrados por `type: 'INSUMO'`.

---

## Proposta de Mudanças

### 1. Acesso a Dados (Backend)

#### [MODIFY] [get-ingredients.ts](file:///c:/Projetos/stock-manager/app/_data-access/ingredient/get-ingredients.ts)
*   Substituir `db.ingredient` por `db.product`.
*   Adicionar filtro `type: 'INSUMO'`.
*   Ajustar a interface `IngredientDto` para herdar de `Product` instead of `Ingredient`.

### 2. Testes E2E (Playwright)

#### [MODIFY] [pdv-and-search.spec.ts](file:///c:/Projetos/stock-manager/e2e/pdv-and-search.spec.ts)
*   Refatorar a seleção de "Forma de Pagamento" para usar `getByRole('combobox')`.
*   Utilizar `getByRole('option')` no portal (popover) para selecionar o método de pagamento (PIX).
*   Adicionar esperas explícitas para o portal de opções estar visível.

---

## Plano de Verificação

### Testes de Integração (Backend)
*   Verificar se a página `/ingredients` volta a carregar a lista de produtos do tipo `INSUMO` sem erros de runtime.

### Testes Automatizados (E2E)
*   Executar `npm run e2e` e garantir que o Cenário 1 (PDV) passe consistentemente em múltiplas execuções.
