# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-02-06

### Added

- **Elite Reporting (Phase 1):** Sistema de exportação XLSX profissional com múltiplas abas.
- **Executive Summary:** Aba dedicada com KPIs financeiros formatados para leitura executiva.
- **Detailed Sales Report:** Aba de dados granulares com filtragem automática e formatação zebra.
- **Premium Formatting:** Suporte nativo a R$ (BRL), cabeçalhos congelados e auto-ajuste de colunas no Excel.

### Changed

- **Help Popovers:** Refatoração da interação de ajuda nos KPIs para clique-para-abrir, melhorando o controle do usuário sobre as explicações.

### Fixed

- **Code Hygiene:** Limpeza de erros de sintaxe e caracteres residuais nos componentes de KPI e arquivos de configuração.

## [1.3.0] - 2026-02-06

### Added

- **Sidebar Profile:** Informações do usuário logado e menu de contexto agora integrados na barra lateral.
- **CSV Export:** Funcionalidade inicial de exportação de produtos e vendas para análise externa.
- **Billing Portal:** Integração com o Customer Portal do Stripe para gestão de assinaturas.
- **Onboarding Flow:** Novo fluxo de boas-vindas para novos usuários e empresas.
- **Success Page:** Página de confirmação de pagamento com animações e feedback visual.

### Changed

- **Analytics Engine:** Refatoração do motor de cálculo para suportar filtros temporais dinâmicos e comparações mensais.
- **Summary Cards:** Interação de ajuda alterada de hover para clique (Popover) para melhor UX em dispositivos móveis e desktop.
- **Landing Page:** Redesign completo focado em conversão e clareza de proposta de valor.

### Fixed

- **Stripe Webhook:** Correção crítica na verificação de assinatura do Webhook que causava loops de processamento.
- **Timezone handling:** Ajuste global no `PeriodFilter` para utilizar o horário local do navegador, evitando saltos de data inesperados.
- **Decimal Serialization:** Remoção de warnings de console relacionados à serialização de tipos Decimal do Prisma.

### Security

- **RBAC:** Implementação de Role-Based Access Control para proteger rotas sensíveis e dados financeiros.

---

## [0.1.0] - 2026-01-15

- Initial MVP release.
- Base architecture with Next.js and Prisma.
  助力
