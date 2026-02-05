# 📦 STOCKLY

> **A modern inventory management system designed to help small and medium-sized businesses organize their stock efficiently.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.10-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Subscription-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Monitoring-362D59?style=flat-square&logo=sentry)](https://sentry.io/)

## 🎯 **Project Overview**

STOCKLY is a multi-tenant SaaS inventory management solution. It empowers businesses to manage multiple companies under a single account, track stock movements with high precision, and scale with a Pro subscription powered by Stripe.

### ✨ **Key SaaS Features**

- **🏢 Multi-tenancy**: Manage multiple companies with isolated data and specific user roles (Owner, Admin, Employee).
- **💳 Subscription Management**: Integrated with Stripe for Pro plans, including usage limits and automated billing.
- **🛡️ Precise Stock Control**: Track entries and exits with `StockMovement` logs for auditing.
- **📊 Real-time Dashboard**: Revenue analytics, stock health monitoring, and sales performance.
- **⚡ Modern Performance**: Server-side rendering with Next.js 14, streaming, and optimized data serialization.
- **🔒 Enterprise Security**: Authentication via Auth.js (NextAuth v5) and whitelisted webhook endpoints.

## 🚀 **Tech Stack**

### **Core Framework**

| Technology  | Version   | Description                                    |
| :---------- | :-------- | :--------------------------------------------- |
| **Next.js** | 14.2.10   | App Router, Server Actions, and Streaming      |
| **Auth.js** | v5 (Beta) | Modern, type-safe authentication               |
| **Prisma**  | 5.19.1    | Type-safe ORM for PostgreSQL                   |
| **Stripe**  | Latest    | Subscription and checkout lifecycle management |
| **Sentry**  | 10.38.0   | Error monitoring and performance tracking      |

### **Frontend & UX**

| Library          | Description                                          |
| :--------------- | :--------------------------------------------------- |
| **Tailwind CSS** | Utility-first styling with custom SaaS design system |
| **shadcn/ui**    | Accessible UI components built on Radix UI           |
| **Lucide React** | Rich icons for intuitive navigation                  |
| **Recharts**     | Interactive data visualization for metrics           |
| **Sonner**       | Clean toast notifications for user feedback          |

## 📊 **Database Architecture**

```mermaid
erDiagram
    Company ||--o{ UserCompany : "has members"
    User ||--o{ UserCompany : "belongs to"
    Company ||--o{ Product : "owns"
    Company ||--o{ Sale : "manages"
    Product ||--o{ SaleProduct : "referenced in"
    Product ||--o{ StockMovement : "tracked in"
    User ||--o{ StockMovement : "performs"
    Sale ||--o{ StockMovement : "triggers"

    Company {
        string id PK
        string name
        enum plan "FREE | PRO"
        int maxProducts
        string stripeCustomerId
    }

    User {
        string id PK
        string email
        string name
    }

    Product {
        string id PK
        string name
        decimal price
        int stock
        int minStock
        string companyId FK
    }

    StockMovement {
        string id PK
        enum type "SALE | ADJUSTMENT"
        int stockBefore
        int stockAfter
        string productId FK
    }
```

## 🛠️ **Installation & Setup**

### **1. Clone & Install**

```bash
git clone https://github.com/tonelopes-dev/stockly.git
cd stockly
npm install
```

### **2. Environment Variables**

Create a `.env` file based on your credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/stockly"
AUTH_SECRET="your-secret"
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_SENTRY_DSN="..."
```

### **3. Database Setup**

```bash
npx prisma generate
npx prisma migrate dev
```

### **4. Stripe Local Development (Webhooks)**

To test subscriptions locally, use the specialized script:

```bash
# Runs Next.js and Stripe CLI simultaneously
npm run stripe:dev
```

## 🧪 **Available Scripts**

| Command              | Description                                               |
| :------------------- | :-------------------------------------------------------- |
| `npm run dev`        | Starts Next.js development server                         |
| `npm run stripe:dev` | **Recommended**: Starts Next.js + Stripe Webhook listener |
| `npm run build`      | Builds the application for production                     |
| `npx prisma studio`  | Desktop GUI for database management                       |
| `npm run lint`       | Runs ESLint for code quality checks                       |

---

## 📁 **Project Structure**

```bash
stockly/
├── app/
│   ├── (protected)/        # Auth-protected routes (Dashboard, Products, Sales, Plans)
│   ├── api/webhooks/       # Stripe Webhook handlers (Raw Body verification)
│   ├── _actions/           # Logic-heavy Server Actions
│   ├── _data-access/       # Clean Data Access Layer (Prisma integration)
│   ├── _lib/               # Auth, Prisma, and Stripe configurations
│   └── instrumentation.ts  # Unified Sentry initialization
├── prisma/                 # Multi-tenant Schema & Seed data
└── package.json            # Scripts, Concurrently, and Dependencies
```

---

<div align="center">

**STOCKLY - Scalable Inventory for Modern Businesses**

[🌐 Live Demo](https://stockly-demo.vercel.app) • [📖 Support](https://github.com/tonelopes-dev/stockly/issues)

</div>
