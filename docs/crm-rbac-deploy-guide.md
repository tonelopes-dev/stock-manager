# CRM RBAC — Guia de Deploy

**Branch:** `feature/crm-rbac-permissions`  
**Base:** `develop`  
**Status:** ✅ Código pronto, TypeScript 0 erros, aguardando deploy

---

## O que foi feito

O módulo `/customers` (CRM) estava sem controle de acesso granular — qualquer colaborador com login ativo acessava e podia criar/editar/deletar clientes livremente.

Foram adicionadas duas novas permissões ao sistema RBAC:

| Permissão | Valor no DB | O que permite |
|---|---|---|
| `CUSTOMER_VIEW` | `customer:view` | Visualizar a lista de clientes e o funil CRM |
| `CUSTOMER_MANAGE` | `customer:manage` | Criar, editar, excluir clientes e gerenciar o funil |

---

## Commits nessa branch (em ordem)

| # | Commit | O que faz |
|---|---|---|
| 1 | `feat(rbac): add CUSTOMER_VIEW and CUSTOMER_MANAGE to permission matrix` | Adiciona as constantes, labels e descriptions em `permissions.ts`. A UI de checkboxes na tela de equipe já exibe os novos itens automaticamente. |
| 2 | `feat(rbac): add idempotent backfill script for CRM permissions on existing ADMINs` | Cria o script `scripts/backfill-crm-permissions.ts` para migrar os ADMINs já existentes no banco. |
| 3 | `feat(rbac): add assertPageCapability CUSTOMER_VIEW guard to CRM route` | Protege a rota `/customers` com `assertPageCapability`. Sem a permissão, o usuário é redirecionado para `/nao-autorizado`. |
| 4 | `feat(rbac): protect all CRM and customer server actions with assertActionCapability` | Adiciona guards nas 12 Server Actions de cliente/CRM. Mutations exigem `CUSTOMER_MANAGE`, queries exigem `CUSTOMER_VIEW`. |
| 5 | `feat(rbac): conditionally hide CRM mutation buttons based on canManage prop` | Oculta os botões "Novo Cliente", "Editar", "Deletar" e o modal de configuração do CRM para usuários sem `CUSTOMER_MANAGE`. |

---

## ⚠️ ATENÇÃO: Ordem obrigatória de deploy

> Se o código novo for para produção antes do backfill, **todos os ADMINs perdem acesso ao CRM imediatamente**. O OWNER nunca é afetado (tem bypass automático).

### Passo 1 — Rodar o backfill no banco de PRODUÇÃO (antes do deploy)

```bash
# Na máquina com acesso ao banco de produção (ou via Vercel CLI com env vars)
npx tsx scripts/backfill-crm-permissions.ts
```

O script vai imprimir um relatório como este:

```
🔄 Iniciando backfill de permissões CRM para ADMINs...
✅ customer:view adicionado em 3 registro(s) de ADMIN
✅ customer:manage adicionado em 3 registro(s) de ADMIN

📊 Estado final dos ADMINs após o backfill:
  • fulano@exemplo.com | customer:view=✅ | customer:manage=✅
  • ciclano@exemplo.com | customer:view=✅ | customer:manage=✅

🎉 Backfill concluído. Safe to deploy.
```

> O script é **idempotente** — pode ser rodado mais de uma vez sem duplicar permissões.

### Passo 2 — Fazer o merge e deploy

```bash
# Merge da branch no develop (ou direto na main, conforme seu fluxo)
git checkout develop
git merge feature/crm-rbac-permissions

# Deploy na Vercel (push para a branch que dispara CI/CD)
git push origin develop
```

---

## Comportamento após o deploy

| Usuário | Acessa `/customers`? | Pode criar/editar cliente? | Pode deletar cliente? |
|---|---|---|---|
| `OWNER` | ✅ Sempre | ✅ Sempre | ✅ Sempre |
| `ADMIN` (existente, pós-backfill) | ✅ Sim | ✅ Sim | ✅ Sim (sem histórico de vendas) |
| `MEMBER` com `customer:view` | ✅ Sim | ❌ Botões ocultos + Action bloqueada | ❌ Bloqueado |
| `MEMBER` com `customer:manage` | ✅ Sim | ✅ Sim | ✅ Sim (sem histórico) |
| `MEMBER` sem nenhuma permissão CRM | ❌ Redirect `/nao-autorizado` | ❌ Action retorna erro 403 | ❌ Bloqueado |

---

## Arquivos modificados

```
app/_lib/permissions.ts                                    ← Nova fonte da verdade
scripts/backfill-crm-permissions.ts                        ← Script de migração [NOVO]
app/(protected)/customers/page.tsx                         ← Guard de rota
app/_actions/customer/upsert-customer/index.ts             ← CUSTOMER_MANAGE
app/_actions/customer/delete-customer/index.ts             ← CUSTOMER_MANAGE
app/_actions/customer/update-customer-stage/index.ts       ← CUSTOMER_MANAGE
app/_actions/customer/update-customer-position/index.ts    ← CUSTOMER_MANAGE
app/_actions/customer/upsert-category/index.ts             ← CUSTOMER_MANAGE
app/_actions/customer/delete-category/index.ts             ← CUSTOMER_MANAGE
app/_actions/customer/update-customer-profile.ts           ← CUSTOMER_MANAGE
app/_actions/customer/update-customer-selfie.ts            ← CUSTOMER_MANAGE
app/_actions/customer/get-customer.ts                      ← CUSTOMER_VIEW
app/_actions/crm/upsert-stage/index.ts                     ← CUSTOMER_MANAGE
app/_actions/crm/delete-stage/index.ts                     ← CUSTOMER_MANAGE
app/_actions/crm/reorder-stages/index.ts                   ← CUSTOMER_MANAGE
app/_actions/crm/update-birthday-reminder.ts               ← CUSTOMER_MANAGE
app/_actions/crm/get-alerts.ts                             ← CUSTOMER_VIEW
app/(protected)/customers/_components/customer-page-client.tsx   ← UI canManage
app/(protected)/customers/_components/customer-list-results.tsx  ← UI canManage
app/(protected)/customers/_components/customer-data-table.tsx    ← UI canManage
app/(protected)/customers/_components/table-columns.tsx          ← UI canManage
app/(protected)/customers/_components/table-dropdown-menu.tsx    ← UI canManage
```

---

## Como conceder acesso CRM a um novo colaborador

Na tela **Configurações → Equipe**, ao editar ou convidar um membro, marque:

- ☑ **Visualizar Clientes** — para acesso read-only ao CRM
- ☑ **Gerenciar Clientes** — para criação, edição e exclusão de clientes

O preset **"Gerência Total"** já inclui ambas automaticamente.
