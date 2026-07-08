# Relatório Técnico: Módulo de Pagamentos (Cliente Final)

> **Autor:** CTO Office / Arquitetura
> **Data:** Julho 2026
> **Escopo:** Análise da implementação atual da rota `/my-orders` e do ecossistema de pagamentos (Next.js App Router, Prisma, Supabase).

---

## 1. Frontend: Rota `/my-orders` e UI

### Estrutura da Página (Server Component)
A rota base `app/(public)/[companySlug]/my-orders/page.tsx` é de fato um **Server Component**. 
Sua principal responsabilidade é validar o `companySlug`, buscar os dados do estabelecimento via `getMenuDataBySlug`, checar se existem integrações de pagamento ativas (InfinitePay ou Mercado Pago) e extrair a chave pública (`publicKey`). Em seguida, ela repassa os dados para o client component injetado.

### Abas de Navegação e Gerenciamento de Estado
A página repassa a renderização para o `MyOrdersClient` (Client Component), que gerencia a sessão do cliente (via `localStorage`) e busca os pedidos usando a Server Action `getMyOrdersAction`. 
As abas (Ativas, Pendentes/Fiados, Histórico) já existem e estão isoladas no componente `OrdersTabGroup`. O estado de qual aba está selecionada e o agrupamento das ordens são gerenciados no lado do cliente (React state).

### Checkout (Modal e Gateways)
O componente de Checkout (`CheckoutPaymentModal` / Sheet inferior) está implementado.
- **Não há redirecionamento** para o ambiente do Mercado Pago.
- A aplicação utiliza o SDK frontend oficial do Mercado Pago (via `mercadopago-bricks-form.tsx`), o que garante uma experiência de **Checkout Transparente**. O próprio "Brick" da interface renderiza os campos nativos de cartão, PIX e Saldo Mercado Pago de forma segura dentro do nosso domínio.
- Para a InfinitePay, no momento a integração depende do redirecionamento (link de checkout gerado e repassado ao cliente).

---

## 2. Backend: Server Actions e Gateways

As Server Actions (localizadas em `app/_actions/integration/`) abstraem a regra de negócio do frontend e servem como camada de segurança:

- **`generateMercadoPagoCheckout`**: Gera um `PaymentIntent` no banco de dados com o valor total e o array de pedidos (`orderIds`) e retorna o `preference_id`.
- **`generateInfinityPayCheckout`**: Semelhante, mas direcionado para a integração com InfinitePay.
- **`generatePixPayment`**: Focado no PDV do lojista (Pagamento Físico Dinâmico via Mercado Pago). Retorna a string do QR Code (`qrCodeBase64`) e o "Copia e Cola" sem gerar tela web.
- **`processTransparentPayment`**: Ação crítica do Checkout Transparente. Recebe o token do cartão gerado no frontend (Bricks) e o ID do `PaymentIntent`. Por segurança, a action busca o valor (`amount`) direto do banco de dados (ignorando o que vem do front) para processar a captura final no Mercado Pago via servidor.

A montagem dos payloads é orquestrada pela camada de serviços (`MercadoPagoGateway` e `InfinityPayGateway`), que implementam a interface `IPaymentGateway`.

---

## 3. Banco de Dados (`schema.prisma`)

### Intenção de Pagamento e Idempotência
Os modelos para gerenciar a transação segura foram adicionados recentemente nas migrations:

```prisma
model PaymentIntent {
  id          String   @id @default(cuid())
  companyId   String
  customerId  String?
  orderIds    String[] // Reflete a mudança da arquitetura de 1:1 para 1:N
  amount      Decimal  @db.Decimal(10, 2)
  status      PaymentIntentStatus
  provider    IntegrationProvider
  externalId  String?  // Ex: preference_id do Mercado Pago
  // ...
}

model PaymentEvent {
  id          String   @id // Formato gerado para garantir unicidade
  companyId   String
  provider    IntegrationProvider
  eventType   String
  status      String
  payload     Json
  // ...
}
```
A tabela `PaymentEvent` serve puramente para garantir **idempotência**, assegurando que se o webhook do gateway enviar a mesma notificação de confirmação 3 vezes, nosso sistema só processe (e só emita a nota ou feche a comanda) 1 única vez.

### Enums de Status
- **`PaymentIntentStatus`**: `PENDING`, `PAID`, `FAILED`, `EXPIRED`.
- **`SaleStatus`**: O enum tem `PENDING_PAYMENT` (novo) e `ACTIVE`.
- **`OrderStatus`**: Utiliza os status padrões da operação: `OPEN`, `PREPARING`, `READY`, `PAID`, `CANCELLED`.

### Take Rate e Split de Pagamentos
O modelo `Company` **ainda não possui** os campos `mpMarketplaceAccountId`, `mpMarketplaceToken` ou `kipoMarketplaceFeeRate`. De acordo com o Dossiê Técnico elaborado para a Fase 1 do Roadmap Financeiro, essa modelagem é o próximo passo a ser implementado.

---

## 4. Webhooks e Realtime

### Recebimento e Idempotência
Temos rotas de API dedicadas para receber os callbacks (ex: `app/api/webhooks/mercadopago/route.ts`).
Essas rotas delegam o trabalho para handlers tipados (como o `tenant-payment.handler.ts`), que fazem o seguinte fluxo:
1. Validam o formato.
2. Inserem/validam o evento no `PaymentEvent` usando transações atômicas para evitar condição de corrida.
3. Se já processado, retornam sucesso (200) antecipado.
4. Se inédito, processam as mudanças no banco (`Sale` -> `ACTIVE` e `Order` -> `PAID`).

### Supabase Broadcast (Realtime)
Após o processamento bem-sucedido e confirmação no banco de dados, o webhook dispara um evento em tempo real (sem payload sensível) via Supabase:

```typescript
// Exemplo conceitual implementado no Handler
await broadcastKdsEvent({
  channel: `company-${companyId}`,
  type: 'PAYMENT_CONFIRMED',
  payload: { saleId }
});
```

Tanto a tela do KDS (Cozinha) quanto a tela do `MyOrdersClient` (`/my-orders`) no celular do cliente estão escutando esses broadcasts (`supabase.channel(...)`). No frontend do cliente (como vimos no componente `MyOrdersClient`), a recepção da mensagem `order_status_update` faz um refresh imediato da tela, eliminando qualquer necessidade de "polling" (recarregar página a cada X segundos).

---

## Resumo e Conclusão

O módulo está **altamente maduro em termos de UX (Bricks e Realtime)** e de **Segurança (PaymentIntent e Idempotência)**. A relação `Sale` vs `Order` já foi expandida para 1:N no Prisma.

Os **Gaps Atuais** que precisam ser desenvolvidos (conforme Fase 1 do Roadmap Fintech):
1. Expansão do Schema da `Company` para guardar as credenciais OAuth de marketplace (`Take Rate`).
2. Implementação das rotas de permissão do lojista (OAuth link com o Mercado Pago).
