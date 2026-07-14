# Relatório de Auditoria: Sistema de Permissões (RBAC)

> **Autor:** Antigravity (Arquiteto de Software de Segurança)
> **Data:** Julho 2026
> **Base de Código:** Next.js 16 App Router + Prisma 5 + PostgreSQL (Supabase)

---

## 1. Camada de Banco de Dados (`schema.prisma`)

### Modelagem Atual

O sistema de controle de acesso usa **dois modelos centrais**:

```prisma
// A relação Many-to-Many entre User e Company,
// com o papel (role) e as permissões granulares embutidos
model UserCompany {
  id          String   @id @default(cuid())
  userId      String
  companyId   String
  role        UserRole @default(MEMBER)
  permissions String[] @default([]) // Capabilities granulares (array de strings)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, companyId])
}

// O enum de papéis com 3 níveis hierárquicos
enum UserRole {
  OWNER
  ADMIN
  MEMBER
}
```

### Análise

**Pontos Fortes:**
- A tabela `UserCompany` funciona corretamente como tabela N:N entre `User` e `Company`, com isolamento multi-tenant garantido.
- O campo `permissions: String[]` já existe no banco — a infra para permissões granulares está pronta, mas subutilizada.
- O modelo `CompanyInvitation` também replica o campo `permissions`, permitindo pré-definir permissões no convite.

**Limitação Estrutural Principal:**
- O campo `permissions: String[]` é uma lista plana de strings sem modelo relacional próprio.
- Não existe hierarquia de permissões no banco.
- Não é possível criar grupos de permissões reutilizáveis (ex: "Perfil Caixa").
- Toda a lógica de "o que cada string significa" vive exclusivamente no código (`app/_lib/permissions.ts`), não no banco.

---

## 2. Camada de Backend e Segurança (Server Actions)

### Mecanismo de Blindagem

Definido em `app/_lib/rbac.ts`, o sistema expõe dois guardas:

#### `assertRole(allowedRoles: UserRole[])` — Verificação por Hierarquia

```typescript
export async function assertRole(allowedRoles: UserRole[]) {
  const authData = await getCurrentUserAuth(); // busca role do DB via UserCompany
  
  if (!authData || !allowedRoles.includes(authData.role)) {
    throw new Error("Ação não permitida: nível de permissão insuficiente.");
  }
  
  return { role: authData.role, userId: authData.userId };
}

// Helpers de legibilidade disponíveis:
export const OWNER_ONLY      = [UserRole.OWNER];
export const ADMIN_AND_OWNER = [UserRole.OWNER, UserRole.ADMIN];
export const ALL_ROLES       = [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER];
```

#### `assertCapability(permission: string)` — Verificação por Capability Granular

```typescript
export async function assertCapability(permission: string) {
  const authData = await getCurrentUserAuth();
  
  if (!authData) throw new Error("Não autenticado.");

  // OWNER tem acesso total — never precisa de capability explícita
  if (authData.role === UserRole.OWNER) return authData;

  // Verifica se a string existe no array permissions do UserCompany
  if (!authData.permissions.includes(permission)) {
    throw new Error("Ação não permitida: nível de permissão insuficiente.");
  }

  return authData;
}
```

#### `getCurrentUserAuth()` — Fonte da Verdade

```typescript
export async function getCurrentUserAuth() {
  const session = await auth();
  const companyId = await getCurrentCompanyId();
  
  if (!session?.user?.id || !companyId) return null;

  // Consulta direta ao banco a cada invocação (sem cache)
  const userCompany = await db.userCompany.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
    select: { role: true, permissions: true },
  });

  return userCompany ? { role, permissions, userId, companyId } : null;
}
```

> AVISO DE PERFORMANCE: Cada Server Action protegida realiza 1 query extra ao banco. Em alta carga, considerar cache Redis com TTL curto.

### Exemplo Prático: MEMBER Tentando Desconectar Integração

```typescript
// app/_actions/integration/disconnect-mercadopago.ts
export const disconnectMercadoPagoAction = actionClient
  .schema(disconnectMercadoPagoSchema)
  .action(async ({ parsedInput: { companyId } }) => {
    // Guarda: lança Error se role não for OWNER ou ADMIN
    await assertRole(["OWNER", "ADMIN"]);
    
    // O código abaixo NUNCA executa para um MEMBER
    await db.company.update({ ... });

    revalidatePath("/integracoes");
    return { success: true };
  });
```

Se um MEMBER chamar essa action via qualquer meio (UI adulterada, Postman, etc.), o `assertRole` lança a exceção e o `actionClient` retorna `{ serverError: "Ação não permitida..." }` sem executar nenhuma mutation.

### Mapa de Proteção das Server Actions

| Domínio | Action | Guarda |
|---|---|---|
| Produto | `upsert-product` | `assertRole(ADMIN_AND_OWNER)` |
| Produto | `delete-product` | `assertRole(ADMIN_AND_OWNER)` |
| Produto | `adjust-stock` | `assertRole(ADMIN_AND_OWNER)` |
| Venda | `upsert-sale` (criar) | `assertRole(ALL_ROLES)` |
| Venda | `upsert-sale` (editar) | `assertRole(ADMIN_AND_OWNER)` |
| Venda | `cancel-sale` | `assertRole(ADMIN_AND_OWNER)` |
| Venda | `delete-sale` | `assertRole(ADMIN_AND_OWNER)` |
| Equipe | `invite-member` | `assertRole(ADMIN_AND_OWNER)` |
| Equipe | `remove-member` | `assertRole(ADMIN_AND_OWNER)` |
| Equipe | `update-member-role` | `assertRole(OWNER_ONLY)` |
| Equipe | `update-member` (perms) | `assertCapability("team:manage")` |
| Integração | `disconnect-mercadopago` | `assertRole(OWNER, ADMIN)` |
| Assinatura | `create-preference` | `assertRole(OWNER_ONLY)` |
| Pagamento | `generate-pix-payment` | `assertCapability("sale:process")` |

### Inconsistência Detectada

```typescript
// Algumas actions usam strings literais — sem type-checking
await assertRole(["OWNER", "ADMIN"]);  // frágil

// Deveria usar a constante tipada
await assertRole(ADMIN_AND_OWNER);     // correto
```

---

## 3. Camada de Frontend (UI e Rotas)

### Como o Frontend Conhece o Papel do Usuário

O papel não é armazenado em Zustand nem Context API. O fluxo é Server-First:

```
JWT Token (NextAuth)
    ↓
auth() callback (Server Component)
    ↓
getCurrentUserRole() → query UserCompany no DB
    ↓
Prop/conditional rendering nos Server Components filhos
```

### Exemplo: Botão "Convidar Membro" na Página de Equipe

```tsx
// app/(protected)/settings/team/page.tsx — Server Component
export default async function TeamPage() {
  // 1. Busca o role no banco (via UserCompany)
  const requesterRole = await getCurrentUserRole();
  
  // 2. Computa permissão de gestão
  const isManagement = requesterRole === UserRole.OWNER 
                     || requesterRole === UserRole.ADMIN;

  return (
    <Header>
      {/* Um MEMBER não recebe esse botão no HTML — nem no React tree */}
      {isManagement && <MemberFormModal mode="invite" />}
    </Header>
  );
}
```

### Como o Papel Entra na Sessão JWT

```typescript
// app/_lib/auth.ts — callback jwt() executado a cada verificação de token
async jwt({ token, user }) {
  const dbUser = await db.user.findUnique({
    where: { id: token.id },
    select: {
      userCompanies: {
        select: { companyId: true, role: true },
        take: 1
      }
    }
  });

  // O role é populado no token pelo callback do NextAuth
  token.role = userCompany?.role ?? UserRole.MEMBER;
  token.companyId = userCompany?.companyId ?? "";

  return token;
}
```

> NOTA IMPORTANTE: O papel no JWT é usado apenas para informação na sessão. A validação real de segurança acontece sempre no servidor via `assertRole()`. A UI usa o papel da sessão para esconder botões, mas a fonte de autorização definitiva é sempre o banco.

---

## 4. Limitações Atuais para Permissões Granulares por Aba/Feature

### O Problema Central

O sistema NÃO possui o conceito de permissão por rota/feature de UI. As capabilities existentes são orientadas a ações (verbos), não a visualizações (substantivos):

```typescript
// app/_lib/permissions.ts — lista atual de capabilities
export const PERMISSIONS = {
  PRODUCT_CREATE: "product:create",   // ação
  PRODUCT_UPDATE: "product:update",   // ação
  PRODUCT_DELETE: "product:delete",   // ação
  SALE_CREATE:    "sale:create",      // ação
  SALE_CANCEL:    "sale:cancel",      // ação
  SALE_VIEW:      "sale:view",        // view (mas NÃO verificado nas rotas)
  STOCK_VIEW:     "stock:view",       // view (mas NÃO verificado nas rotas)
  KDS_VIEW:       "kds:view",         // view
  KDS_MANAGE:     "kds:manage",       // ação
  TEAM_MANAGE:    "team:manage",      // ação
  AUDIT_VIEW:     "audit:view",       // view
  COMPANY_UPDATE: "company:update",   // ação
} as const;
```

### Lacunas que Impedem a Customização por Aba

#### 1. Nenhuma Rota de Página Verifica Capabilities

```tsx
// app/(protected)/sales/page.tsx
const role = await getCurrentUserRole();
// A aba de Vendas é visível para qualquer membro logado.
// NÃO existe: await assertCapability("sale:view")
```

Para que um OWNER possa bloquear a aba de faturamento para um ADMIN, seria necessário:
1. Criar a capability `billing:view` em `PERMISSIONS`
2. Chamar `assertCapability("billing:view")` no `page.tsx` da rota de faturamento
3. Verificar na sidebar para esconder o link de navegação

#### 2. A Sidebar Não Recebe o Perfil de Capabilities

```tsx
// app/_components/sidebar.tsx (comportamento atual)
// Renderiza TODOS os links para qualquer usuário autenticado
// Não existe filtragem por capabilities
<SidebarLink href="/sales">Vendas</SidebarLink>
<SidebarLink href="/faturamento">Faturamento</SidebarLink>
```

#### 3. ADMIN é um Papel Estático (Não Customizável)

No modelo atual, ADMIN tem permissões pré-definidas codificadas no fonte. Não existe mecanismo para que o dono defina:
> "Quero que meu Gerente (ADMIN) veja tudo EXCETO a aba de Faturamento"

#### 4. Capabilities Verificadas Apenas em Mutations, Não em Rotas

| Rota | Verifica capability? |
|---|---|
| `/sales` | NÃO |
| `/products` | NÃO |
| `/estoque` | NÃO |
| `/customers` | NÃO |
| `/audit` | NÃO |
| `/settings/team` | NÃO (só oculta o botão "Convidar") |

---

## Conclusão Executiva

| Aspecto | Status Atual |
|---|---|
| Isolamento de tenant por companyId | SOLIDO |
| Hierarquia de papéis (OWNER > ADMIN > MEMBER) | FUNCIONAL |
| Proteção de mutations (escrita) | BEM COBERTA com `assertRole` |
| Proteção de visualizações (rotas/abas) | AUSENTE |
| Permissões customizáveis por usuário individual | INFRA NO BANCO, mas pouco usada |
| UI responsiva a capabilities (sidebar dinâmica) | AUSENTE |
| Perfis de permissão reutilizáveis (RBAC Groups) | NAO EXISTE no schema |
| Performance do check de permissão | 1 query por Action, sem cache |

### Próximos Passos Sugeridos

1. **Curto prazo** — Verificar capabilities nas rotas de visualização (`page.tsx` + sidebar) usando o `permissions[]` que já existe no banco.
2. **Médio prazo** — Adicionar capabilities de visualização faltantes (`billing:view`, `reports:view`, etc.).
3. **Longo prazo** — Introduzir `PermissionGroup` (perfis reutilizáveis como "Caixa", "Cozinha", "Gerente Financeiro") com nova migration no schema.
