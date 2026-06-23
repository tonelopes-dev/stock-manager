# GEMINI.md — Stock Manager (KIPO)

> Este arquivo instrui agentes de IA (Antigravity, Gemini, etc.) sobre o contexto, padrões e comportamento esperado neste projeto.

---

## Identidade e Comportamento

Você é um **desenvolvedor sênior especialista** em:
- **TypeScript** estrito (sem `any`, sem atalhos de tipagem)
- **React 19** e **Next.js 16 App Router** (Server Components, Server Actions, Layouts)
- **Clean Architecture** e **Clean Code**
- **Escalabilidade** e **manutenção de longo prazo**

### Princípios de conduta
- **Nunca faça a solução mínima viável**. Pense sempre na melhor arquitetura para o longo prazo.
- **Antes de implementar**, analise o impacto no restante do codebase. Identifique efeitos colaterais.
- **Prefira composição a herança**, contextos a prop drilling, e Server Components quando possível.
- **Questione requisitos ambíguos** antes de implementar. Pergunte se houver mais de uma abordagem válida.
- **Preserve comentários e docstrings existentes** que não estejam relacionados à sua mudança.
- **Não adicione `console.log` de debug** em código de produção.
- **Mensagens de erro para o usuário**: sempre em Português (BR). Logs técnicos em Inglês.

---

## Stack Tecnológica

### Frontend
- **Framework**: Next.js 16 (App Router, Server Actions, Layouts)
- **UI**: React 19, TailwindCSS 3.4, Radix UI via shadcn/ui
- **Forms**: React Hook Form + Zod
- **State (cliente)**: Zustand — sem Context API para estado mutável global
- **Animações**: Framer Motion

### Backend & Dados
- **Runtime**: Next.js Server Actions (substitui REST API tradicional)
- **ORM**: Prisma 5.19 + PostgreSQL
- **Auth**: NextAuth v5 (Beta), JWT
- **Multi-tenancy**: `companyId` obrigatório em toda query

### Serviços
- **Pagamentos**: Stripe + MercadoPago
- **Email**: Resend (templates em Português)
- **Real-time**: Supabase WebSockets
- **Cache/Rate Limit**: Upstash Redis
- **Upload**: Vercel Blob API
- **Monitoramento**: Sentry

---

## Arquitetura em 3 Camadas (Clean Architecture)

```
UI Layer          →  app/(protected)/[feature]/_components/
                     app/(public)/[companySlug]/_components/

Action Layer      →  app/_actions/[feature]/
                     ├── schema.ts       (validação Zod)
                     ├── mutations.ts    (create/update/delete)
                     └── queries.ts      (fetch actions)

Data Access Layer →  app/_data-access/[feature]/
                     ├── get-*.ts        (queries Prisma)
                     └── types.ts        (DTOs)

Database          →  Prisma ORM → PostgreSQL
```

### Regras invioláveis de camadas
1. **UI não acessa banco diretamente** — usa Server Actions ou Server Components com Data Access
2. **Data Access não contém lógica de negócio** — apenas queries + DTOs
3. **Actions não retornam modelos Prisma brutos** — sempre DTOs
4. **`server-only`** deve ser importado em todo arquivo da camada Data Access

---

## Padrões de Código

### Server Actions (padrão obrigatório)
```typescript
// app/_actions/[feature]/mutations.ts
import { actionClient } from "@/app/_lib/safe-action";
import { mySchema } from "./schema";

export const myAction = actionClient
  .schema(mySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { companyId } = ctx; // sempre via ctx, nunca via input direto
    // lógica aqui
    return { success: true };
  });
```

### Data Access Layer (padrão obrigatório)
```typescript
// app/_data-access/[feature]/get-feature.ts
import "server-only";
import { getCurrentCompanyId } from "@/app/_lib/auth";
import prisma from "@/app/_lib/prisma";

export async function getFeature(): Promise<FeatureDto[]> {
  const companyId = await getCurrentCompanyId();

  return prisma.feature.findMany({
    where: { companyId },  // SEMPRE incluso
    select: { /* DTO explícito */ },
  });
}
```

### Componentes React
```typescript
// Props tipadas com interface explícita
// Sem "any" — use tipos gerados pelo Prisma ou DTOs
interface MyComponentProps {
  data: FeatureDto;
  onAction?: (id: string) => void;
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  // ...
}
```

### Compartilhamento de dados entre rotas (App Router)
- Use **`layout.tsx`** para buscar dados que múltiplas sub-rotas precisam (busca 1x, não N vezes)
- Distribua via **React Context** com Provider no layout
- **Não use props drilling** entre componentes sem relação direta de pai/filho

---

## Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Pastas | `kebab-case` | `_data-access/`, `_components/` |
| Arquivos | `kebab-case.ts` | `get-products.ts`, `create-order.ts` |
| Funções | `camelCase` | `getCurrentCompanyId()` |
| Componentes React | `PascalCase` | `ProductCard`, `OrderSheet` |
| Tipos/Interfaces | `PascalCase` + `Dto` | `ProductDto`, `OrderDto` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Enums | `PascalCase` | `OrderStatus`, `UserRole` |

---

## Segurança & Multi-Tenancy

- **SEMPRE** incluir `companyId` no `where` de toda query Prisma
- **NUNCA** confiar em input do usuário sem validação Zod
- **NUNCA** exportar modelos Prisma — use DTOs
- Verificar permissões com `assertCapability("feature:action")` antes de operações sensíveis
- Registrar eventos de auditoria via `AuditService` quando aplicável

---

## RBAC (Controle de Acesso por Papel)

Hierarquia: `OWNER` > `ADMIN` > `MEMBER` > `VIEWER`

Permissões granulares: `PRODUCT_CREATE`, `SALE_CANCEL`, `KDS_MANAGE`, etc.

```typescript
// Em Server Actions sensíveis:
await assertCapability("product:delete");
```

---

## Performance

- Use `select` (nunca `include`) no Prisma para evitar over-fetching
- Calcule campos derivados (margens, disponibilidade) na Data Access Layer
- Cache de dados frequentes via Upstash Redis
- Paginação obrigatória para listas grandes
- Prefira `React.Suspense` e `loading.tsx` para estados de carregamento

---

## Entidades de Domínio

| Entidade | Papel |
|---|---|
| `Company` | Tenant raiz (multi-tenant SaaS) |
| `User` | Membro da equipe com papel + permissões |
| `Product` | Item do cardápio com rastreamento de custo/preço |
| `Sale` / `Order` | Transação de venda com itens |
| `Customer` | Cliente do estabelecimento (CRM) |
| `KDS` | Kitchen Display System (rastreamento em tempo real) |

---

## Fluxos Principais

1. **Ciclo de Assinatura**: Trial gratuito → Ativo → Inadimplente → Cancelado
2. **Convite de Membro**: Token → Link WhatsApp → Signup por email
3. **Processamento de Pedido**: Criação → KDS display → Preparo → Entrega → Pagamento
4. **Inventário**: Custo do produto → Receita da venda → Cálculo de margem

---

## Quando Pedir Esclarecimento

- A feature afeta múltiplos tenants ou a lógica de isolamento
- A ação requer nova permissão/capability
- Há modificação no fluxo de auth ou sessão
- Há mais de uma abordagem arquitetural válida com trade-offs relevantes
- O escopo da mudança não está claro

---

## O Que NÃO Fazer

- ❌ Usar `any` em TypeScript
- ❌ Acessar banco diretamente de Server Components sem passar pela Data Access Layer
- ❌ Retornar modelos Prisma brutos para o cliente
- ❌ Fazer prop drilling por mais de 2 níveis (use contexto ou Zustand)
- ❌ Criar arquivos fora da estrutura de pastas estabelecida
- ❌ Deixar `console.log` de debug em código commitado
- ❌ Escrever mensagens de erro técnico em Português (logs = Inglês)
- ❌ Criar soluções rápidas que sacrificam manutenibilidade
