# Plano de Arquitetura e Implementação: Sistema de Pagamentos Premium Kipo

Este documento centraliza a estratégia para a evolução do sistema de pagamentos, transformando-o de um MVP (Redirecionamento) para um Checkout Transparente (Online) e Omnichannel (Maquininhas Físicas), focado em Clean Architecture. Mais do que isso, documenta o fim de débitos técnicos críticos de banco de dados.

## 1. Análise do Projeto Atual (MVP)

Atualmente, o Kipo integra pagamentos via Mercado Pago e InfinitePay utilizando o **Checkout Pro (Redirect)**.
- **O que falta para ser um SaaS de Alto Valor:** Atrito no Checkout (redirecionamento), tratamento de erros genérico, falta de integração com PDV presencial, tipagens fracas (`any`), e amarras no banco de dados que dificultam agrupar pagamentos.

---

## 2. Regra de Ouro: Tipagem Estrita (Fim do `any`)

Conforme estabelecido pela engenharia do projeto, **é expressamente proibido o uso de `any`** no ecossistema de pagamentos (e no sistema como um todo). Toda entrada (body de webhook, retorno de API) deve ser validada por schemas rigorosos (Zod) e interfaces TypeScript (`IWebhookPayload`, `IPaymentResponse`), garantindo que o sistema seja inquebrável.

---

## 3. O Fim das "Gambiarras" (Plano de Ação para o DB)

O sistema hoje possui um débito técnico crítico na relação entre Vendas (`Sale`) e Pedidos (`Order`), onde a relação é 1-para-1 (`Sale` possui um único `orderId`). Isso gerou o famoso "hack do adjustmentReason", onde agrupamos pedidos em uma mesma cobrança salvando strings aleatórias nos pedidos secundários para que o Webhook saiba encontrá-los. 

### Contexto: Relação Sale vs Order
A relação precisa passar de 1:1 para 1:N (Uma Venda possui vários Pedidos).
**A Estratégia Segura (Expand-and-Contract Pattern):** 
1. **Fase de Expansão (Expand):** Adicionamos a nova coluna `saleId` no modelo `Order` e configuramos a relação `Sale -> orders[]` no `schema.prisma`. **NÃO APAGAMOS** a coluna `orderId` de `Sale` ainda. Rodamos a migração.
2. **Backfill (Migração de Dados):** Com ambas as colunas existindo, rodaremos o script SQL para copiar os vínculos antigos para o novo modelo:
   ```sql
   UPDATE "Order" SET "saleId" = (SELECT id FROM "Sale" WHERE "Sale"."orderId" = "Order".id);
   ```
3. **Refatoração de Código:** Atualizamos todo o sistema (Services, Actions, Webhooks) para ler/gravar de `order.saleId` em vez de `sale.orderId`.
4. **Limpeza (Contract):** Depois deletamos a coluna `orderId` do modelo `Sale` no Prisma e rodamos a migração final de limpeza.

### Contexto: O hack do `adjustmentReason`
Como a integração de agrupamento do Mercado Pago **ainda não foi para produção**, temos uma vantagem enorme! **Não precisaremos de lógicas de "Fallback"** ou retrocompatibilidade para links antigos do Mercado Pago.
Apenas substituiremos o hack atual pela nova tabela `PaymentIntent` no banco de dados. 

---

## 4. Experiência de Usabilidade (UI/UX) e Novos Componentes

### A) Experiência Online (Visão do Cliente no Cardápio)
Abre-se um Modal (ou Bottom Sheet elegante no celular) com as opções de pagamento injetadas ali mesmo usando o componente `<MercadoPagoBricks />`. Sem recarregar a página e sem redirecionar.

### B) Experiência Presencial (Visão do Caixa/Lojista no PDV)
Criaremos o `<POSPaymentTerminal />` no Caixa.
- Se **PIX**: O Caixa mostrará o QR Code gigantão na tela ou enviará o link diretamente via API do WhatsApp App/Web.
- Se **Maquininha**: A tela entra num estado de "Aguardando pagamento na maquineta".
- **Magia Real-Time (`usePaymentRealtime` hook):** Conectado ao Supabase Broadcast, o sistema fecha a tela sozinho e imprime a nota assim que o cliente passa o cartão na máquina física.

---

## 5. Checklist de Implementação (Etapas Atualizadas)

Dividimos o projeto em 4 Fases seguras e independentes.

### Fase 1: Limpeza da Casa, Banco de Dados e Clean Architecture
- `[ ]` **MIGRAÇÃO CRÍTICA (Expansão):** Atualizar `schema.prisma`. Adicionar `saleId` em `Order` e `orders Order[]` em `Sale`.
- `[ ]` **SCRIPT SQL DE PROTEÇÃO:** Rodar o SQL de migração dos dados antigos de Vendas.
- `[ ]` **Nova Entidade `PaymentIntent`:** Criar tabela no Prisma para rastrear sessões de checkout agrupadas (Remoção total da lógica de `adjustmentReason`).
- `[ ]` **Nova Entidade `PaymentEvent`:** Criar tabela para garantir **Idempotência** dos Webhooks.
- `[ ]` **MIGRAÇÃO CRÍTICA (Limpeza):** Após refatorar o código, remover `orderId` de `Sale`.
- `[ ]` Refatorar webhooks para tipagem estrita com Zod (fim de todos os `any`).
- `[ ]` Criar a interface de Gateway (`IPaymentGateway`) e a implementação concreta `MercadoPagoGateway`.

### Fase 2: Checkout Transparente Online (Bricks)
- `[ ]` Criar componente React `<TransparentCheckoutForm />` usando `@mercadopago/sdk-react` (Payment Bricks).
- `[ ]` Implementar a Action Server-side `processTransparentPayment` que gera o `PaymentIntent` no banco, recebe o token do Brick e finaliza a transação sem sair da página.

### Fase 3: Integração Pix Direto (Monitor e WhatsApp)
- `[ ]` Implementar geração de Pix pela API do MP retornando o "Copia e Cola" e o QR Code.
- `[ ]` Na UI do PDV, criar o Modal de Recebimento PIX com as 2 opções.
- `[ ]` Escutar o Webhook via Supabase Broadcast para atualizar a UI em real-time.

### Fase 4: Integração de Máquinas Físicas (In-Person / Point API)
- `[ ]` Implementar fluxo OAuth / Auth do Mercado Pago no painel do Lojista.
- `[ ]` Criar botão "Cobrar na Maquininha" na tela do PDV.
- `[ ]` Implementar a Action que cria o `PaymentIntent` e dispara para a Point API.

---

## Verification Plan

1. A **Fase 1** deve ser executada com extremo cuidado no Banco de Dados. Nenhum dado do passado da tabela `Sale` pode se perder. Para isso a estratégia de "Expand-and-Contract" com o Script SQL manual foi documentada.
2. O Código não será aprovado se houver **qualquer** uso da palavra `any` nos serviços financeiros.
3. Testes de Stress de Webhooks para validar a Idempotência da tabela `PaymentEvent`.
