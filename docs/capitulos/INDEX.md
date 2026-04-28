# 🧠 Kipo ERP — Cérebro do Projeto

> **Versão:** 1.0 | **Última Atualização:** 2026-04-24 | **Stack:** Next.js 15 (App Router) + Prisma + PostgreSQL (Supabase) + NextAuth v5

Este repositório contém a documentação técnica modular do Kipo ERP. Cada capítulo é um ficheiro `.md` independente que pode ser consumido como contexto por um agente de IA ou lido por um novo membro da equipa.

---

## Leis de Engenharia

Estas são as regras invioláveis que governam qualquer alteração neste repositório.

### Lei 1 — TDD Primeiro (Test-Driven Development)

| Etapa | Ação |
|---|---|
| 🔴 RED | Escrever o teste unitário/integração (Vitest) que **falha** |
| 🟢 GREEN | Escrever o código mínimo para o teste **passar** |
| 🔵 REFACTOR | Limpar, extrair, otimizar sem quebrar testes |

**Nunca** escreva o código da feature antes dos testes. A suite vive em `tests/` com a configuração em `vitest.config.ts` (execução sequencial, timeout de 30s para testes de integração com DB).

### Lei 2 — Regra do Escoteiro (Clean Code)

> "Deixe o código mais limpo do que encontrou."

- Arquivo com mais de **200-300 linhas**? Extraia componentes atômicos.
- Query Prisma trazendo dados demais? Use `select` explícito.
- Lógica de negócio duplicada? Centralize num `Service`.
- Componente com estado + lógica + UI acoplados? Extraia hooks e sub-componentes.

### Lei 3 — Documentação Viva (Continuous Documentation)

Se a tarefa altera **regras de negócio**, **schema do banco** ou **fluxos arquiteturais**, o respectivo ficheiro `.md` nesta pasta **deve ser atualizado na mesma iteração**. Código e documentação caminham em sincronia — nunca um sem o outro.

### Lei 4 — Zero Trust (Segurança by Design)

Toda Server Action deve passar por esta checklist antes de ser considerada pronta:

| Verificação | Mecanismo | Ficheiro |
|---|---|---|
| **Validação de Entrada** | Zod schema via `next-safe-action` | `_lib/safe-action.ts` |
| **Autenticação** | `auth()` do NextAuth v5 | `_lib/auth.ts` |
| **Autorização (RBAC)** | `assertRole(ADMIN_AND_OWNER)` | `_lib/rbac.ts` |
| **Isolamento Multi-tenant** | `getCurrentCompanyId()` + filtro `companyId` em toda query | `_lib/get-current-company.ts` |
| **Anti Over-posting** | Schema Zod restringe campos atualizáveis | Schema da action |
| **Anti N+1** | `select` explícito, BFS para árvores de composição | `_lib/stock.ts` |

---

## Mapa de Capítulos

| # | Capítulo | Ficheiro | Escopo |
|---|---|---|---|
| 01 | [Autenticação & Permissões](./capitulos/01-auth-permissoes.md) | `capitulos/01-auth-permissoes.md` | Multi-tenant, NextAuth v5, RBAC, proteção de rotas, `sessionVersion` |
| 02 | [Cardápio Digital](./capitulos/02-cardapio-digital.md) | `capitulos/02-cardapio-digital.md` | Frontend público `[companySlug]`, Zustand (`useCartStore`), fluxo da sacola, identificação de cliente |
| 03 | [Gestão de Estoque](./capitulos/03-gestao-estoque.md) | `capitulos/03-gestao-estoque.md` | Baixa decimal (`Decimal(10,4)`), `StockMovement`, composição recursiva (Ficha Técnica), motor de lote |
| 04 | [Motor de Promoções](./capitulos/04-motor-promocoes.md) | `capitulos/04-motor-promocoes.md` | `promoSchedule` (JSON), preço riscado, `isFeatured`, agendamentos por dia/hora |
| 05 | [KDS & Realtime](./capitulos/05-kds-realtime.md) | `capitulos/05-kds-realtime.md` | Supabase Realtime (Channels), ciclo de vida do pedido (`PENDING → PAID`), Order Tracker |

---

## Mapa de Rotas

### Rotas Protegidas (`/app/(protected)/`)

Requerem sessão autenticada. Geridas pelo `layout.tsx` com verificação de `auth()`.

| Rota | Módulo | Descrição |
|---|---|---|
| `/dashboard` | Dashboard | Painel principal com KPIs |
| `/cardapio` | Catálogo de Produtos | CRUD de produtos, composição, categorias |
| `/estoque` | Gestão de Estoque | Movimentações, ajustes manuais, entradas |
| `/sales` | Vendas & Comandas | PDV, comandas abertas, histórico |
| `/kds` | Kitchen Display System | Painel de cozinha em tempo real |
| `/menu-management` | Cardápio Digital (Admin) | Visibilidade no menu, promoções, branding |
| `/customers` | CRM | Clientes, categorias, checklists |
| `/fornecedores` | Fornecedores | Cadastro de fornecedores |
| `/goals` | Metas | Metas de vendas por produto |
| `/settings/audit` | Auditoria | Logs de todas as ações administrativas |
| `/settings/company` | Configurações | Dados da empresa, slug, branding |
| `/settings/team` | Equipa | Convites, roles (OWNER/ADMIN/MEMBER) |

### Rotas Públicas (`/app/(public)/[companySlug]/`)

Acessíveis sem autenticação. O `companySlug` é resolvido via `getMenuDataBySlug()`.

| Rota | Descrição |
|---|---|
| `/[companySlug]` | Cardápio digital público |
| `/[companySlug]/my-orders` | Pedidos do cliente (por `customerId` em cookie/localStorage) |
| `/[companySlug]/order/[orderId]` | Tracker de pedido individual (realtime) |

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| Auth | NextAuth v5 (`@auth/core`) | 5.x |
| ORM | Prisma | 5.19 |
| Database | PostgreSQL (Supabase) | 15 |
| Realtime | Supabase Channels (Realtime) | — |
| State (Client) | Zustand (persist) | 5.x |
| Validação | Zod + next-safe-action | — |
| Testes | Vitest | — |
| Deploy | Vercel | — |
| Storage | Vercel Blob | — |

---

## Estrutura de Diretórios (Simplificada)

```
app/
├── (protected)/          # Rotas autenticadas (backoffice)
│   ├── cardapio/         # CRUD de produtos
│   ├── estoque/          # Gestão de estoque
│   ├── sales/            # PDV e comandas
│   ├── kds/              # Kitchen Display System
│   ├── menu-management/  # Admin do cardápio público
│   └── settings/         # Auditoria, empresa, equipa
├── (public)/             # Rotas públicas (cardápio digital)
│   └── [companySlug]/    # Slug dinâmico da empresa
│       ├── _components/  # MenuClient, BottomNav, etc.
│       ├── _store/       # useCartStore (Zustand)
│       ├── my-orders/    # Pedidos do cliente
│       └── order/        # Tracker de pedido
├── _actions/             # Server Actions (next-safe-action)
├── _components/          # Componentes globais (sidebar, header)
├── _data-access/         # Camada de leitura (Prisma queries)
├── _lib/                 # Core: auth, prisma, rbac, stock, etc.
├── _services/            # Lógica de negócio: audit, order
└── api/                  # API Routes (upload, customers, webhooks)

prisma/
└── schema.prisma         # Schema do banco (735 linhas, ~30 models)

tests/
├── unit/                 # Testes unitários (KDS engine)
├── integration/          # Testes de integração (stock, sales)
└── helpers/              # Test utilities e factories

docs/                     # 📍 Você está aqui
├── INDEX.md              # Este ficheiro
└── capitulos/
    ├── 01-auth-permissoes.md
    ├── 02-cardapio-digital.md
    ├── 03-gestao-estoque.md
    ├── 04-motor-promocoes.md
    └── 05-kds-realtime.md
```

---

## Enums Críticos do Schema

### `UserRole` — Papéis de Acesso

| Valor | Descrição | Permissões |
|---|---|---|
| `OWNER` | Dono da empresa | Tudo, incluindo exclusão de empresa e transferência de posse |
| `ADMIN` | Administrador | Gestão completa exceto operações destrutivas |
| `MEMBER` | Membro | Apenas operações do dia-a-dia (PDV, KDS) |

### `OrderStatus` — Ciclo de Vida do Pedido

```
PENDING → PREPARING → READY → DELIVERED → PAID
                                    ↘ CANCELED
```

### `StockMovementType` — Tipos de Movimentação

| Tipo | Direção | Contexto |
|---|---|---|
| `ORDER` | ↓ Saída | Baixa automática ao criar pedido |
| `SALE` | ↓ Saída | (Legacy) Baixa direta por venda |
| `CANCEL` | ↑ Estorno | Cancelamento de pedido/venda |
| `ADJUSTMENT` | ↕ Ambos | Ajuste manual do operador |
| `PURCHASE` | ↑ Entrada | Entrada via nota fiscal |
| `PRODUCTION` | ↕ Ambos | Produção/consumo de receitas |
| `WASTE` | ↓ Saída | Perda/desperdício |
| `MANUAL` | ↕ Ambos | (Legacy) Movimentação manual |

### `UnitType` — Unidades de Medida

| Valor | Nome | Precisão |
|---|---|---|
| `UN` | Unidade | Inteiro |
| `KG` | Quilograma | Decimal (10,4) |
| `G` | Grama | Decimal (10,4) |
| `L` | Litro | Decimal (10,4) |
| `ML` | Mililitro | Decimal (10,4) |
| `PCT` | Pacote | Inteiro |
| `MC` | Maço | Inteiro |
