# 📦 KIPO (Português/Brasil)

> **Um sistema de gestão de estoque e vendas moderno, pronto para o mercado, focado em escalabilidade multi-tenant e precisão operacional.**

<div align="center">

[![🇺🇸 English](../README.md)](../README.md)

</div>

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Assinaturas-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Monitoramento-362D59?style=flat-square&logo=sentry)](https://sentry.io/)

## 🎯 **Visão Geral do Projeto**

O KIPO é uma solução SaaS multi-tenant robusta (v1.4.0). Ele permite que proprietários de negócios gerenciem o estoque em múltiplas empresas, coordenem equipes com permissões granulares e obtenham insights financeiros profundos por meio de análises avançadas — tudo isso escalando sem esforço com assinaturas via Stripe.

### ✨ **Pilares do Sistema**

- **🏢 Multi-tenancy Avançado**: Isolamento total de dados entre empresas. Um único usuário pode fazer part de várias organizações com papéis diferentes.
- **📑 Vendas e PDV Modular (Novo)**: Uma interface de vendas completamente refatorada com componentes especializados para gestão de Carrinho, seleção de Clientes e Resumo Financeiro reativo. Suporta **Venda Avulsa** com precisão cirúrgica.
- **🧑‍🍳 KDS (Kitchen Display System)**: Sistema de gestão de pedidos na cozinha em tempo real. Acompanhe o status dos pedidos em diferentes estágios de preparação com sincronização automática via **SSE (Server-Sent Events)**.
- **🔔 CRM e Central de Notificações**: Inteligência integrada para relacionamento com o cliente. Alertas automáticos de aniversários, ajustes manuais de preço com justificativa e um hub global de notificações.
- **📉 Analytics e Relatórios Avançados**: Motores financeiros que rastreiam receita, lucro e margem. Exporte relatórios profissionais em **XLSX** com métricas calculadas para auditoria offline.
- **👥 Gestão de Equipes**: Hierarquia de permissões profissional (**Dono**, **Admin**, **Membro**). Inclui fluxo de convite via **WhatsApp**.

## 🚀 **Stack Tecnológica**

### **O Motor (Backend/Core)**

| Tecnologia | Papel | Destaques |
| :--- | :--- | :--- |
| **Next.js 16** | Base | App Router, Server Actions, PPR (Partial Prerendering) |
| **React 19** | UI Library | Actions, UseOptimistic, Transitions, Ciclo de Vida Avançado |
| **Auth.js v5** | Segurança | Autenticação Type-safe e gestão de sessão multi-tenant |
| **Prisma ORM** | Dados | Integração PostgreSQL com schema relacional robusto |
| **Stripe** | Receita | Faturamento automatizado, webhooks e ciclo de vida de planos |
| **Sentry** | Confiabilidade | Monitoramento de erros full-stack e rastreamento de performance |

### **A Experiência (Frontend)**

| Biblioteca | Descrição |
| :--- | :--- |
| **Tailwind CSS** | Estilização premium com glassmorphism |
| **shadcn/ui** | Componentes robustos baseados em Radix UI |
| **Framer Motion** | Micro-animações fluidas e transições suaves |
| **ExcelJS** | Geração de relatórios XLSX complexos em alta performance |
| **Recharts** | Visualização dinâmica de dados financeiros |
| **Sonner** | Sistema global de notificações interativas |

## 🛠️ **Instalação e Configuração**

### **1. Implantação Rápida**

```bash
git clone https://github.com/tonelopes-dev/stock-manager
npm install
npx prisma generate
```

### **2. Modo de Desenvolvimento**

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Executar migrações do banco de dados
npx prisma migrate dev
```

## 📁 **Estrutura do Projeto**

```bash
kipo/
├── app/
│   ├── (protected)/        # Dashboard, Vendas (PDV), Produtos, Equipe, CRM
│   ├── auth/               # Login, Fluxo de recuperação de senha
│   ├── _actions/           # Server Actions Transacionais (o coração da lógica)
│   ├── _data-access/       # Camada de Acesso a Dados (Repository Pattern)
│   ├── _lib/               # Configurações core (Auth, RBAC, Prisma, Stripe)
│   └── _components/        # UI global reutilizável (Central de Notificações)
├── prisma/                 # Schema Relacional com isolamento Multi-tenant
└── docs/                   # Documentação adicional e README em PT-BR
```

---

<div align="center">

**KIPO - Potencializando a Gestão Moderna de Estoque e Vendas**

[🌐 Acessar Kipo](https://usekipo.com.br/) • [🛠️ Issues](https://github.com/tonelopes-dev/stock-manager/issues)

</div>
