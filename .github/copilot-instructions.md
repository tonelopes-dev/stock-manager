# Stock-Manager Copilot Instructions

## Project Overview
Stock-Manager (KIPO) is a **production-grade SaaS platform** for restaurant/food business management. It's a **multi-tenant Next.js 16 + React 19** application with TypeScript, featuring team management, inventory control, sales tracking, KDS (Kitchen Display System), and subscription billing.

**Key Domain**: Restaurant Operations Management (inventory, sales, team roles, real-time order tracking)

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Server Actions)
- **UI**: React 19, TailwindCSS 3.4, Radix UI (shadcn/ui), Framer Motion
- **Forms**: React Hook Form + Zod (strict validation)
- **State**: Zustand (lightweight, no providers needed)
- **Charts**: Recharts for analytics
- **File Export**: ExcelJS for XLSX generation

### Backend & Data
- **Runtime**: Node.js via Next.js Server Actions (no traditional REST API)
- **Database**: PostgreSQL (Prisma 5.19 ORM)
- **Auth**: NextAuth v5 (Beta), JWT tokens, session storage in Prisma
- **Multi-tenancy**: Enforced via `companyId` on all queries (row-level security pattern)

### Services & Integrations
- **Payments**: Stripe (webhooks ready) + MercadoPago SDK
- **Email**: Resend with Portuguese templates
- **Real-time**: Supabase WebSockets (KDS live sync), Server-Sent Events
- **Caching**: Upstash Redis (rate limiting, session caching)
- **File Storage**: Vercel Blob API
- **Monitoring**: Sentry error tracking
- **Testing**: Vitest unit tests, Playwright E2E tests

---

## Architecture Principles

### 1. Clean 3-Layer Separation
```
UI Layer (React Components in app/(protected)/)
    ↓
Action Layer (Server Actions in app/_actions/)
    ↓
Data Access Layer (Repository pattern in app/_data-access/)
    ↓
Database (Prisma ORM)
```

### 2. Multi-Tenancy by Design
- **Every query** receives `companyId` via `getCurrentCompanyId()` middleware
- Data isolation enforced at the ORM level, not application level
- Users linked to companies via `UserCompany` junction table with roles/permissions
- Queries explicitly include `where: { company: { id: companyId } }`

### 3. Server Actions as API Layer
- No REST endpoints needed (Next.js Server Actions replace them)
- Type-safe: client automatically gets correct types from server action
- All actions wrapped with `actionClient` for centralized validation + error handling
- Portuguese error messages for end users

### 4. RBAC (Role-Based Access Control)
- Roles: `OWNER` (full access) > `ADMIN` > `MEMBER` > `VIEWER`
- 13 granular permissions: `PRODUCT_CREATE`, `SALE_CANCEL`, `KDS_MANAGE`, etc.
- Checked via `assertCapability("feature:action")` in actions
- Pre-defined role templates for common use cases (COZINHA, ATENDIMENTO, GERENCIA)

### 5. Middleware-Based Route Protection
- Authentication check (redirects to `/login`)
- Role-based route restrictions (ADMIN can't access `/plans`)
- Subscription status guard (past-due accounts → `/billing-required`)
- Soft-delete lifecycle management for companies

---

## File Organization & Naming

### Folder Structure
```
app/
├── (protected)/          # Auth-guarded routes
│   └── [feature]/
│       ├── _components/  # Feature-specific components (domain grouped if > 8 files)
│       ├── _hooks/       # Feature-specific hooks
│       └── _context/     # Feature-specific contexts
├── (public)/             # Public tenant pages
│   └── [companySlug]/
│       ├── _components/  # public menu UI (subfolders: layout, product, cart, checkout)
│       ├── _context/     # public menu contexts
│       ├── _hooks/       # public menu hooks
│       └── _store/       # public menu zustand stores
├── _actions/             # Server Actions (organized by feature)
│   └── [feature]/
│       ├── schema.ts     # Zod validation schemas
│       ├── mutations.ts  # Create/Update/Delete actions
│       └── queries.ts    # Fetch actions
├── _data-access/         # Repository Pattern (queries only)
│   └── [feature]/
│       ├── get-*.ts      # Query functions
│       └── types.ts      # DTOs
├── _services/            # Business logic, cross-cutting concerns
├── _lib/                 # Core configs only (auth, prisma, redis, safe-action)
├── _utils/               # Stateless helper functions (currency, pricing, dates, stocks)
├── _providers/           # React Context Providers for global state (subscription, app-mode)
├── _components/          # Global UI components (e.g. ui/ button, input, dialog)
├── api/                  # API routes (webhooks, etc.)
└── (auth)/               # Auth pages (login, register)
```

### Naming Conventions
- **Folders**: `kebab-case` (`_data-access/`, `_components/`)
- **Files**: `kebab-case.ts` (`get-products.ts`, `invite-user.ts`, `create-order.action.ts`)
- **Functions**: `camelCase` (`getCurrentUserAuth()`, `calculateMargin()`)
- **Types/Interfaces**: `PascalCase` + `Dto` suffix (`ProductDto`, `SaleDto`, `UserCompanyDto`)
- **Constants**: `UPPER_SNAKE_CASE` (`OWNER_ONLY`, `PERMISSIONS.PRODUCT_CREATE`)
- **React Components**: `PascalCase` (`ProductCard`, `MemberCardActions`, `KdsBoard`)
- **Enums**: `PascalCase` (`UserRole`, `ProductType`, `SaleStatus`)

---

## Key Coding Patterns

### Pattern 1: Server Actions with Safe-Action Wrapper
```typescript
// app/_lib/safe-action.ts provides centralized validation + error handling
// All actions follow this pattern:

import { actionClient } from "@/app/_lib/safe-action"
import { inviteUserSchema } from "./schema"

export const inviteUserAction = actionClient
  .schema(inviteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { companyId } = ctx
    // Zod validation already passed
    // Error messages automatically sent in Portuguese
    // Logs validation duration & errors centrally
    return { success: true, data: { userId: "..." } }
  })
```

### Pattern 2: Data Access Layer (Queries Only)
```typescript
// app/_data-access/product/get-products.ts
import { "server-only" } from "server-only"
import { getCurrentCompanyId } from "@/app/_lib/auth"
import prisma from "@/app/_lib/prisma"

export async function getProducts() {
  const companyId = await getCurrentCompanyId()
  
  return prisma.product.findMany({
    where: { company: { id: companyId } },
    select: {
      id: true,
      name: true,
      costPrice: true,
      // Return clean DTOs, not Prisma models
    }
  })
}
```
- **Always** mark with `"server-only"` to prevent client imports
- **Always** enforce `companyId` in the `where` clause
- Return DTOs (clean objects), not raw Prisma models
- Calculate derived fields (margins, availability) here

### Pattern 3: Type-Safe Component Props
```typescript
// Use Zod schemas for runtime validation of props
// Pass data as DTOs, not raw Prisma models
// Example:
import { ProductDto } from "@/app/_data-access/product/types"

interface ProductCardProps {
  product: ProductDto
  onEdit?: (id: string) => void
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
  return <div>{product.name}</div>
}
```

### Pattern 4: Centralized Permission Checks
```typescript
// In server actions, always check capability:
import { assertCapability } from "@/app/_lib/rbac"

export const deleteProductAction = actionClient
  .schema(deleteProductSchema)
  .action(async ({ parsedInput, ctx }) => {
    await assertCapability("product:delete") // Throws error if not allowed
    // Proceed with deletion
  })
```

### Pattern 5: Service Layer for Complex Logic
```typescript
// app/_services/invitation.service.ts
// app/_services/audit.service.ts
// Business logic that spans multiple features lives here
// Examples: email dispatch, audit event logging, analytics calculations
```

---

## Best Practices & Guidelines

### Security & Data Isolation
1. **ALWAYS** include `companyId` enforcement in data access queries
2. **NEVER** trust user input directly—validate with Zod schemas
3. **NEVER** export Prisma models; use DTOs instead
4. Check capabilities with `assertCapability()` before sensitive operations
5. Log audit events via `AuditService` for compliance

### Performance
- Use `select` (not `include`) in Prisma queries to avoid N+1 problems
- Compute derived fields (margin, availability) in data access layer
- Cache frequently accessed data (roles, permissions) via Redis
- Use pagination for large result sets

### Code Quality
- Keep functions focused on single responsibility
- Use TypeScript strict mode (no `any` types)
- Validate form inputs with Zod schemas early
- Return consistent error shapes from actions
- Log errors to Sentry for monitoring

### UI/UX Patterns
- Use TailwindCSS classes (no inline styles)
- Import shadcn/ui components from `@/components/ui/`
- Handle loading states with React Suspense where possible
- Show Portuguese error messages to users (English in logs)
- Confirm destructive actions with dialogs

### Database Patterns
- Use Prisma transactions for multi-step operations
- Set `DIRECT_URL` in `.env` for migrations (PostgreSQL requirement)
- Use soft deletes (`deletedAt` field) instead of hard deletes
- Index frequently filtered fields (companyId, status, createdAt)

---

## Common Workflows & Patterns

### Adding a New Feature
1. Create action schema in `app/_actions/[feature]/schema.ts`
2. Create server action in `app/_actions/[feature]/mutations.ts`
3. Create data access function in `app/_data-access/[feature]/get-*.ts`
4. Create UI components in `app/(protected)/[feature]/_components/`
5. Add capability check if permission-gated
6. Test with `@/app/_lib/safe-action` wrapper (handles validation automatically)

### Querying Data
- Use `getCurrentCompanyId()` to get context
- Always enforce `companyId` in `where` clause
- Return DTOs, not raw Prisma models
- Calculate derived fields in the query

### Handling Errors
- Throw errors in server actions; `actionClient` catches them
- Use Prisma-specific error handling in `safe-action.ts`
- Return user-friendly Portuguese messages via `ServerError` class
- Log to Sentry via middleware

### Real-Time Features
- KDS (orders) use Supabase WebSockets
- Dashboard updates via Server-Sent Events
- Use Redis for rate limiting & session caching

---

## Domain-Specific Knowledge

### Key Entities
- **Company**: Root tenant (multi-tenant SaaS)
- **User**: Team member with role + permissions
- **Product**: Menu items with cost/price tracking
- **Sale**: Order transaction with line items
- **Customer**: CRM stage tracking (prospect, won, lost)
- **KDS**: Kitchen Display System (real-time order tracking)

### Key Workflows
- **Subscription Lifecycle**: Free trial → Active → Past Due → Cancelled
- **Member Invitation**: Token generation → WhatsApp link → Email signup
- **Order Processing**: Sale creation → KDS display → Fulfillment → Payment
- **Inventory**: Product cost tracking → Sale revenue → Margin calculation

---

## When to Ask for Clarification

- If the feature affects multiple tenants (multi-tenancy edge case)
- If the action requires a new capability/permission
- If modifying auth flow or session handling
- If adding new integrations (Stripe, Resend, etc.)
- If changing RBAC model or roles
