# 📦 KIPO

> **A modern, enterprise-ready inventory management system designed for multi-tenant scalability and precision.**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Subscription-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Monitoring-362D59?style=flat-square&logo=sentry)](https://sentry.io/)

## 🎯 **Project Overview**

KIPO is a robust multi-tenant SaaS solution. It enables business owners to manage inventory across multiple companies, coordinate teams with granular permissions, and gain deep financial insights through advanced analytics—all while scaling effortlessly with Stripe-powered subscriptions.

### ✨ **Core SaaS Pillars**

- **🏢 Advanced Multi-tenancy**: Complete data isolation across companies. A single user can be part of multiple organizations with different roles.
- **📑 Automatic Comandas (New)**: Real-time synchronization of customer consumption. Orders from the Digital Menu update the dashboard instantly via **SSE (Server-Sent Events)**.
- **👥 Identity & Team Management**: Professional role hierarchy (**Owner**, **Admin**, **Member**). Includes a frictionless **WhatsApp invitation flow**.
- **📈 Professional Analytics**: Growth engines that track revenue, cost, profit, and margin trends. Dynamic period filters with interactive charts.
- **💳 Enterprise Billing**: Full Stripe & Mercado Pago integration with Pro plans and usage-based limitations.
- **🛡️ Audit & Security**: Transactional stock movements, sales linked to specific users (Audit Trail), and encrypted credential management.

## 🚀 **Tech Stack**

### **The Engine**

| Technology     | Role        | Features                                                   |
| :------------- | :---------- | :--------------------------------------------------------- |
| **Next.js 16** | Foundation  | App Router, Server Actions, PPR (Partial Prerendering)     |
| **React 19**   | UI Library  | Actions, UseOptimistic, Enhanced Component Lifecycle       |
| **Auth.js v5** | Security    | Type-safe authentication & session management              |
| **Prisma ORM** | Data        | PostgreSQL integration with multi-tenant relational schema |
| **Stripe**     | Revenue     | Automated billing, webhooks, and subscription lifecycle    |
| **Sentry**     | Reliability | Full-stack error monitoring and performance tracing        |

### **The Experience**

| Library          | Description                                     |
| :--------------- | :---------------------------------------------- |
| **Tailwind CSS** | Premium glassmorphism and modern UI tokens      |
| **shadcn/ui**    | Robust components powered by Radix UI           |
| **Recharts**     | Dynamic financial data visualization            |
| **Sonner**       | Interactive, non-blocking user notifications    |
| **Zod**          | End-to-end schema validation for server actions |

## 📊 **Relational Architecture**

```mermaid
erDiagram
    Company ||--o{ UserCompany : "has members"
    User ||--o{ UserCompany : "linked to"
    Company ||--o{ Product : "owns"
    Company ||--o{ Sale : "manages"
    Product ||--o{ SaleProduct : "included in"
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
        boolean needsPasswordChange
    }

    UserCompany {
        enum role "OWNER | ADMIN | MEMBER"
    }

    Product {
        string id PK
        string name
        decimal price
        int stock
        int minStock
    }

    Sale {
        string id PK
        decimal totalAmount
        string createdBy FK
    }
```

## 🛠️ **Installation & Features**

### **1. Rapid Deployment**

```bash
git clone https://github.com/tonelopes-dev/stock-manager
npm install
npx prisma generate
```

### **2. Advanced Features**

- **Smart Exports**: Generate professional CSV reports for products and sales with calculated financial metrics.
- **Low Stock Alerts**: Real-time dashboard indicators when items fall below their `minStock` threshold.
- **WhatsApp Onboarding**: Invite members by generating a temporary access link sent directly via WhatsApp.
- **Onboarding Guard**: Mandatory step-by-step setup for new companies to ensure data integrity.

## 📁 **Project Structure**

```bash
kipo/
├── app/
│   ├── (protected)/        # Dashboard, Team, Profile, Products, Sales
│   ├── auth/               # Login, Forgot Password, Reset Password
│   ├── _actions/           # Transactional Server Actions (User, Sale, Product)
│   ├── _data-access/       # Repository Pattern for clean data fetching
│   └── _lib/               # Core configs (Auth, RBAC, Prisma, Stripe)
├── prisma/                 # Relational Multi-tenant Schema
└── package.json            # Scripts for Dev and Stripe Local Listeners
```

---

<div align="center">

**KIPO - Empowering Modern Inventory Management**

[🌐 Access Kipo](https://usekipo.com.br/) • [🛠️ Issues](https://github.com/tonelopes-dev/stock-manager/issues)

</div>
