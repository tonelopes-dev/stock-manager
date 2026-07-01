# Estratégia: Produto sem Ambiente Configurado

## Contexto do Problema

Quando um produto é ativado no cardápio digital (`isVisibleOnMenu = true`) sem ter um `environmentId` configurado, o comportamento atual é:

1. **No menu digital (cliente):** O produto aparece normalmente, mas numa categoria virtual "Destaques" (para sem categoria) ou na categoria correta (se ela estiver setada). Isso está **ok**.
2. **No KDS:** O item entra em todos os pedidos, mas com `environmentId = null`. O fallback codificado em `get-kds-orders.ts` atribui o nome `"Cozinha"` ao item, porém sem um ID de ambiente real. Por isso, o item **só aparece na aba "EXPEDIÇÃO"** e some de qualquer aba de praça específica.

---

## Avaliação das Estratégias

### Estratégia 1 — Bloquear a ativação no menu (Proibição)

**Como funcionaria:** Na action `toggleMenuVisibility`, antes de ativar, verificar se o produto tem `environmentId`. Se não tiver, lançar um erro informativo impedindo a ativação.

| | |
|---|---|
| ✅ Vantagem | Simples de implementar. Erro claro para o usuário. |
| ❌ Desvantagem | **Experiência ruim.** O usuário vai ser bloqueado sem entender o porquê. O fluxo de cadastro de produto não direciona o usuário para configurar o ambiente. Impede casos legítimos de produtos que não precisam de KDS (ex: bebidas embaladas em loja de balcão sem praça definida). |

> **Avaliação: NÃO RECOMENDADO.** Punir o usuário sem educá-lo é a pior experiência possível.

---

### Estratégia 2 — Exibir aviso/alerta na interface (Educação do usuário)

**Como funcionaria:** Na página de gerenciamento de cardápio (`menu-management`), quando o usuário tentar ativar o toggle de visibilidade de um produto sem ambiente, exibir um Dialog/Alert explicando que o item não terá uma praça de preparo no KDS, e perguntando se quer continuar assim mesmo.

| | |
|---|---|
| ✅ Vantagem | Transparente. Informa o operador do risco sem bloquear. Fácil de implementar (só no client-side). |
| ⚠️ Limitação | O produto ainda entra com `environmentId = null`. O problema **não é resolvido tecnicamente**, apenas comunicado. |

> **Avaliação: BOM PALIATIVO, mas incompleto sozinho.**

---

### Estratégia 3 — Fallback dinâmico para "Expedição" no KDS (Absorção no sistema)

**Como funcionaria:** No KDS, itens com `environmentId = null` são tratados como pertencentes a um ambiente especial de sistema chamado `"SEM_PRAÇA"` (ou similar). Este ambiente virtual é exibido como uma aba extra no KDS com um ícone de aviso (⚠️), deixando claro para o expedidor que há itens não configurados. Os operadores de praças específicas (cozinha, bar, etc.) continuam sem ver esses itens — o que é **correto**, pois não há praça definida.

| | |
|---|---|
| ✅ Vantagem | Não quebra o fluxo. O expedidor vê todos os itens. Deixa óbvio quais produtos precisam de configuração. |
| ✅ Vantagem | Implementação 100% no frontend e na Data Access Layer. Sem migration. |
| ⚠️ Limitação | O item ainda fica "perdido" para as praças. O expedidor precisa gerenciar manualmente. |

> **Avaliação: BOA SOLUÇÃO TÉCNICA, mas incompleta para o negócio.**

---

### Estratégia 4 — Configuração obrigatória antes de ativar no menu (Guardrail no Fluxo)

**Como funcionaria:** No `menu-management`, a chave de visibilidade fica desabilitada (`disabled`) enquanto o produto não tiver um `environmentId`. Um tooltip ou banner abaixo do toggle explica: _"Para ativar no cardápio, configure a praça de preparo do produto."_ Um link direto leva o usuário para editar o produto. A flag só é habilitada depois que o produto for salvo com um `environmentId` preenchido.

| | |
|---|---|
| ✅ Vantagem | Previne o problema na raiz, no momento certo do fluxo. |
| ✅ Vantagem | UX guiada: o usuário entende **o que fazer** para resolver. |
| ✅ Vantagem | Sem mudanças no banco de dados. |
| ⚠️ Limitação | Não resolve retroativamente os produtos já ativos sem ambiente. Precisa de uma tela de auditoria ou varredura manual. |

> **Avaliação: MELHOR ESTRATÉGIA PREVENTIVA.**

---

### Estratégia 5 — Estratégia Combinada (Recomendação Final)

A abordagem ideal é **combinar as Estratégias 3 e 4**:

**Fase 1 — Guardrail no Fluxo (Estratégia 4):**
- No `menu-product-card.tsx`, desabilitar o toggle de visibilidade quando `environmentId === null`.
- Mostrar tooltip: _"Configure a praça de preparo antes de ativar no cardápio digital."_
- Adicionar um botão de atalho "Configurar Praça" no card.

**Fase 2 — Absorção Segura no KDS (Estratégia 3):**
- Em `kds-client.tsx`, criar uma aba especial `"SEM PRAÇA ⚠️"` que aparece apenas quando existirem itens com `environmentId = null` em pedidos ativos.
- Em `get-kds-orders.ts`, o fallback continua como `"Cozinha"` para manter a retrocompatibilidade, mas distinguimos os itens sem ambiente pelo `environmentId === null`.
- O expedidor vê os itens e consegue avançar o status normalmente pela aba "EXPEDIÇÃO".

**Fase 3 — Auditoria de Produtos (Opcional, futuro):**
- Uma seção no `menu-management` listando todos os produtos `isVisibleOnMenu = true` com `environmentId = null`, com um CTA de "Configurar Praça" para cada um.

---

## Resumo de Impacto por Arquivo

| Arquivo | Mudança | Complexidade |
|---|---|---|
| `menu-product-card.tsx` | Desabilitar toggle se sem ambiente + tooltip | Baixa |
| `get-menu-management-data.ts` | Incluir `environmentId` no DTO | Baixa |
| `kds-client.tsx` | Aba virtual "SEM PRAÇA" condicional | Média |
| `get-kds-orders.ts` | Nenhuma — fallback já existe | Nenhuma |
| Schema Prisma | **Nenhuma alteração necessária** | Nenhuma |

---

## Decisão

> **Recomendo implementar a Estratégia Combinada (5), começando pela Fase 1 (Guardrail no Fluxo).**
> Esta é a solução que melhor equilibra **experiência do usuário**, **integridade operacional do KDS** e **ausência de débito técnico novo**.
> Confirme se quer prosseguir com essa abordagem para eu criar o plano de implementação detalhado.
