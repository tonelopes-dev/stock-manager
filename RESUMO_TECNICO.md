# 📊 Resumo do Projeto: StockManager (KIPO)

### 🏗️ Stack Completa

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Frontend**: [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Backend**: Next.js Server Actions & API Routes
- **Banco de Dados**: [PostgreSQL](https://www.postgresql.org/) com [Prisma ORM](https://www.prisma.io/)
- **Autenticação**: [Auth.js v5](https://authjs.dev/) (NextAuth Beta)
- **Pagamentos/SaaS**: [Stripe](https://stripe.com/) (Assinaturas e Lifecycle de Planos)
- **Monitoramento**: [Sentry](https://sentry.io/)
- **Visualização de Dados**: [Recharts](https://recharts.org/)
- **Validação**: [Zod](https://zod.dev/) e [React Hook Form](https://react-hook-form.com/)
- **Outros**: ExcelJS (Exportação), Lucide React (Ícones), Sonner (Toasts)

### 💡 Problema Real que Resolve

O StockManager resolve a dificuldade de pequenas e médias empresas em gerir estoque de forma profissional e centralizada. Ele elimina o uso de planilhas manuais ao oferecer:

1. **Controle Multi-tenant**: Gestão de múltiplas empresas sob uma mesma conta.
2. **Auditoria de Estoque**: Registro detalhado de cada movimentação (entrada, saída, venda, ajuste).
3. **Inteligência Financeira**: Dashboards automáticos que mostram lucro real, margem de contribuição e histórico de custos.
4. **Prevenção de Ruptura**: Alertas de estoque baixo baseados em parâmetros configuráveis (`minStock`).

### ⚙️ Complexidade Técnica

- **Arquitetura Multi-tenant**: Isolamento lógico de dados em nível de banco de dados via `companyId`.
- **RBAC (Role-Based Access Control)**: Diferenciação de permissões entre **Owner**, **Admin** e **Member**.
- **Data Access Layer (DAL)**: Implementação de um padrão de repositório para centralizar consultas ao banco, garantindo segurança e evitando vazamento de dados entre tenants.
- **Sincronização com Stripe**: Uso de Webhooks para gerenciar status de assinatura, limites de plano e acesso a funcionalidades pro.
- **Modelagem Gastronômica**: Suporte a produtos preparados que descontam ingredientes (receitas) do estoque durante a venda.

### 🔐 Autenticação?

**Sim.** Implementada com **Auth.js v5**, suportando:

- Login via credenciais (Email/Senha).
- Fluxo de **onboarding** para novos membros.
- **Password Reset** e troca obrigatória de senha no primeiro acesso.
- Proteção de rotas via Middleware.

### 🗄️ Banco?

**Sim.** Utiliza **PostgreSQL** como banco relacional, modelado com **Prisma**. O schema conta com entidades para Produtos, Vendas, Movimentações, Ingredientes, Receitas, Usuários e Empresas.

### ⚖️ Regras de Negócio?

- **Limites de Plano**: Travas automáticas baseadas no plano (ex: limite de 20 produtos no plano Free).
- **Validação de Estoque**: Impede vendas de itens sem saldo (configurável para permitir estoque negativo se desejado).
- **Abatimento Automático**: Ao realizar uma venda, o sistema calcula o custo médio e atualiza o saldo de estoque em tempo real.
- **Convites Estruturados**: Geração de tokens de convite para membros da equipe via WhatsApp.

### 🌐 Multi-tenant?

**Sim.** Design nativo SaaS. Usuários podem estar vinculados a múltiplas empresas com diferentes cargos em cada uma.

### ⚡ Performance?

O projeto utiliza as melhores práticas do Next.js 14:

- **Server Components**: Para carregamento rápido e redução do bundle de JS no cliente.
- **Streaming & Suspense**: Feedback visual imediato durante o carregamento de dashboards pesados.
- **Parallel Routes**: Para carregar diferentes partes do dashboard simultaneamente sem bloqueios.

### 🚀 Deploy?

- Configurado com **Dockerfile** e **Docker Compose** para ambientes isolados.
- Otimizado para deploy na **Vercel** ou infraestruturas que suportem Node.js.

### 👤 Usuários Reais?

**Sim.** O sistema possui infraestrutura completa para produção, incluindo processamento de pagamentos reais via Stripe e monitoramento de erros em tempo real com Sentry, estando pronto para escalabilidade comercial.
