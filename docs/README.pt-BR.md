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

## 🎯 **Visão Geral do Projeto: KIPO - Uma Plataforma SaaS de Nível de Produção para Operações de Restaurantes**

O KIPO é uma solução SaaS multi-tenant altamente escalável (v1.4.0), meticulosamente projetada para revolucionar a gestão de restaurantes e negócios alimentícios. Ele capacita proprietários com controle abrangente de estoque, rastreamento preciso de vendas, um Kitchen Display System (KDS) em tempo real e coordenação robusta de equipes com permissões granulares. Desenvolvido para estar pronto para empresas, o KIPO oferece insights financeiros profundos através de análises avançadas e garante escalabilidade contínua com gestão de assinaturas integrada via Stripe.

### **Abordando Desafios do Mundo Real:**

O KIPO resolve as complexidades enfrentadas por pequenas e médias empresas na gestão profissional e centralizada de estoque e vendas. Ele vai além das planilhas manuais ao oferecer:
- **Controle Multi-tenant Centralizado**: Gerencie múltiplas empresas sob uma única conta com isolamento completo de dados.
- **Auditoria Abrangente de Estoque**: Registro detalhado de cada movimentação (entrada, saída, venda, ajuste) para rastreabilidade total.
- **Inteligência Financeira**: Dashboards automatizados que fornecem lucro real, margem de contribuição e histórico de custos em tempo real.
- **Gestão Proativa de Estoque**: Alertas configuráveis de estoque baixo (`minStock`) para prevenir rupturas e otimizar níveis de inventário.

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

## 🏛️ **Arquitetura e Padrões de Código**

O KIPO segue padrões arquiteturais de nível empresarial que garantem qualidade de código, segurança e escalabilidade:

### **Separação Limpa em 3 Camadas**
```
Camada de UI (Componentes React)
    ↓
Camada de Ações (Server Actions - API Type-safe)
    ↓
Camada de Acesso a Dados (Repository Pattern - Operações CRUD)
    ↓
Banco de Dados (PostgreSQL + Prisma)
```

### **Princípios Arquiteturais-Chave**

- **Multi-tenancy por Design**: Cada query força isolamento de `companyId` no nível do ORM. Vazamentos de dados entre tenants são arquiteturalmente impossíveis.
- **Server Actions Type-Safe**: Aproveita Next.js Server Actions com validação Zod para segurança de tipo fim-a-fim, do cliente ao banco de dados.
- **Controle de Acesso Baseado em Papéis (RBAC)**: Sistema de permissões granulares (`DONO` > `ADMIN` > `MEMBRO` > `VISUALIZADOR`) com 13+ verificações de capacidade para operações sensíveis.
- **Data Transfer Objects (DTOs)**: Separação limpa de modelos de banco de dados de respostas de API. Modelos brutos do Prisma nunca saem da camada de acesso a dados.
- **Otimização de Performance**: Uso estratégico de `select()` do Prisma (nunca `include()`) para evitar queries N+1 e otimizar tempos de resposta.
- **Tratamento de Erros**: Tratamento centralizado de erros via wrapper `safe-action` com mensagens em português para usuários e logs em inglês para debug.

### **Testes e Garantia de Qualidade**

- **Testes Unitários**: Vitest para validação de lógica de negócio
- **Testes de Integração**: Testando Server Actions com interações de banco de dados
- **Testes E2E**: Playwright para fluxos de usuário (login, vendas, relatórios, etc.)
- **Segurança de Tipo**: Modo TypeScript strict sem `any` implícito

## 🔐 **Segurança e Conformidade**

- ✅ Isolamento de dados multi-tenant forçado no nível do ORM
- ✅ Padrões de segurança em nível de linha via filtragem de `companyId`
- ✅ Hash de senha com algoritmos padrão da indústria
- ✅ Gestão de sessão baseada em JWT com armazenamento em Prisma
- ✅ Verificações de permissão RBAC em cada operação sensível
- ✅ Integração com Sentry para monitoramento de erros em tempo real e rastreamento de performance
- ✅ Logs de auditoria para conformidade e responsabilidade

---

<div align="center">

**KIPO - Potencializando a Gestão Moderna de Estoque e Vendas**

[🌐 Acessar Kipo](https://usekipo.com.br/) • [🛠️ Issues](https://github.com/tonelopes-dev/stock-manager/issues) • [📖 Documentação Técnica](../docs/)

</div>

## 💼 **Para Desenvolvedores e Líderes Técnicos**

Este repositório demonstra:
- **Arquitetura Empresarial**: Separação limpa de responsabilidades com multi-tenancy real
- **TypeScript Moderno**: Modo strict com segurança de tipo fim-a-fim
- **Boas Práticas**: Princípios SOLID, padrões de design e estruturas de pastas escaláveis
- **Código Pronto para Produção**: Tratamento de erros, monitoramento, testes e documentação

**Interessado em se juntar à equipe ou colaborar?** Entre em contato através de [GitHub Issues](https://github.com/tonelopes-dev/stock-manager/issues) ou visite nosso website.

## 📄 **Licença e Atribuição**

O KIPO foi construído com ❤️ e funciona como implementação de referência para plataformas SaaS. Para detalhes de licença, consulte o arquivo [LICENSE](../LICENSE).

---

<div align="center">

**Elevando operações de restaurantes através de tecnologia moderna.** ✨

</div>
