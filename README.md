# 📦 KIPO

> **A modern, enterprise-ready inventory management system designed for multi-tenant scalability and precision.**

<div align="center">

[![Português (Brasil)](https://img.shields.io/badge/Leia_em-Português-green?style=for-the-badge&logo=readme)](./docs/README.pt-BR.md)

</div>

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Subscription-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Monitoring-362D59?style=flat-square&logo=sentry)](https://sentry.io/)

## 🎯 **Project Overview**

KIPO is a robust multi-tenant SaaS solution (v1.4.0). It enables business owners to manage inventory across multiple companies, coordinate teams with granular permissions, and gain deep financial insights through advanced analytics—all while scaling effortlessly with Stripe-powered subscriptions.

### ✨ **Core SaaS Pillars**

- **🏢 Advanced Multi-tenancy**: Complete data isolation across companies. A single user can be part of multiple organizations with different roles.
- **📑 Modular Sales & POS (New)**: A completely refactored sales interface featuring specialized containers for Cart management, Customer selection, and real-time Financial Summaries. Supports **Venda Avulsa** (one-off sales) with precision.
- **🧑‍🍳 Kitchen Display System (KDS)**: Real-time order management system. Track order status across different prep stages with automatic synchronization via **SSE (Server-Sent Events)**.
- **🔔 CRM & Notification Center**: Integrated intelligence for customer relationships. Automatic alerts for birthdays, manual price adjustments with justification, and a global notification hub.
- **📉 Advanced Analytics & Reporting**: Deep financial engines that track revenue, profit, and margins. Export professional **XLSX reports** with calculated metrics for offline auditing.
- **👥 Identity & Team Management**: Professional role hierarchy (**Owner**, **Admin**, **Member**). Includes a frictionless **WhatsApp invitation flow**.

## 🚀 **Tech Stack**

### **The Engine**

| Technology | Role | Features |
| :--- | :--- | :--- |
| **Next.js 16** | Foundation | App Router, Server Actions, PPR (Partial Prerendering) |
| **React 19** | UI Library | Actions, UseOptimistic, Transitions, Enhanced Lifecycle |
| **Auth.js v5** | Security | Type-safe authentication & multi-tenant session management |
| **Prisma ORM** | Data | PostgreSQL integration with relational multi-tenant schema |
| **Stripe** | Revenue | Automated billing, webhooks, and subscription lifecycle |
| **Sentry** | Reliability | Full-stack error monitoring and performance tracing |

### **The Experience**

| Library | Description |
| :--- | :--- |
| **Tailwind CSS** | Premium glassmorphism and modern UI tokens |
| **shadcn/ui** | Robust components powered by Radix UI (Radix 1.x) |
| **Framer Motion** | Fluid micro-animations and smooth UI transitions |
| **ExcelJS** | High-performance generation of complex XLSX reports |
| **Recharts** | Dynamic data visualization for financial trends |
| **Sonner** | Interactive, global notification system |

## 📊 **Relational Architecture**

```mermaid
erDiagram
    Company ||--o{ UserCompany : "has members"
    User ||--o{ UserCompany : "linked to"
    Company ||--o{ Product : "owns"
    Company ||--o{ Sale : "manages"
    Sale ||--o{ SaleItem : "contains"
    Product ||--o{ SaleItem : "refers to"
    Product ||--o{ StockMovement : "movement log"
    User ||--o{ Sale : "registers"
    User ||--o{ StockMovement : "performs"

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
        string phone
        string password
    }

    Product {
        string id PK
        string name
        decimal price
        decimal cost
        decimal operationalCost
        int stock
    }

    Sale {
        string id PK
        decimal totalAmount
        decimal tipAmount
        decimal discountAmount
        string paymentMethod
        string createdBy FK
    }
```

## 🛠️ **Installation & Setup**

### **1. Rapid Deployment**

```bash
git clone https://github.com/tonelopes-dev/stock-manager
npm install
npx prisma generate
```

### **2. Development Mode**

```bash
# Start the development server
npm run dev

# Run database migrations
npx prisma migrate dev
```

## 📁 **Project Structure**

```bash
kipo/
├── app/
│   ├── (protected)/        # Dashboard, Sales (PDV), Products, Team, CRM
│   ├── auth/               # Login, Password recovery flow
│   ├── _actions/           # Transactional Server Actions (the core logic)
│   ├── _data-access/       # Clean Room Data Access Layer (Repository Pattern)
│   ├── _lib/               # Core configs (Auth, RBAC, Prisma, Stripe)
│   └── _components/        # Reusable global UI (Notification Center, Layout)
├── prisma/                 # Relational Schema with Multi-tenant isolation
└── docs/                   # Additional documentation and PT-BR README
```

---

<div align="center">

**KIPO - Empowering Modern Inventory & Sales Management**

[🌐 Access Kipo](https://usekipo.com.br/) • [🛠️ Issues](https://github.com/tonelopes-dev/stock-manager/issues)

</div>
