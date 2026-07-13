# Relatório de Dívida Técnica — Fluxo Financeiro Kipo

> **Autor:** Antigravity (Arquiteto Fintech)
> **Data:** 2026-07-13
> **Escopo:** Análise crítica de qualidade de código das rotas, services e componentes envolvidos no fluxo financeiro.

---

## 1. SOLID e Arquitetura

### 1.1 ❌ `process-transparent-payment.ts` — 222 linhas, SRP violado

**Arquivo:** [`process-transparent-payment.ts`](file:///c:/Projetos/stock-manager/app/_actions/integration/process-transparent-payment.ts)

Esta Server Action faz **tudo**:
1. Valida credenciais da empresa (linha 84–97)
2. Busca PaymentIntent (linha 99–105)
3. Extrai e normaliza o payload do Bricks SDK (linha 108)
4. Valida segurança de valores (linhas 110–122)
5. Monta URL de notificação (linhas 124–126)
6. Coerce tipos (issuer_id String→Number, linha 137)
7. Chama a API do MP (linha 145)
8. Se aprovado: atualiza PaymentIntent, busca Orders, calcula gorjeta, converte para Sale, faz broadcast (linhas 157–194)
9. Traduz erros do MP para português (linhas 199–202)
10. Retorna resposta formatada (linhas 206–212)

**Recomendação:** Extrair em 3 camadas:
```
PaymentOrchestrator (Action)     → Orquestra o fluxo
├── BricksPayloadService         → Extrai, valida e normaliza payloads
├── MercadoPagoGateway           → Já existe, mas precisa absorver o envio do application_fee
└── PaymentCompletionService     → Converte orders em Sale + broadcast (DRY com webhook)
```

O bloco de "aprovado na hora" (linhas 157–194) é **idêntico** ao que o `tenant-payment.handler.ts` faz nas linhas 165–207. Isso é duplicação pura.

### 1.2 ❌ `tenant-payment.handler.ts` — 243 linhas, dois fluxos misturados

**Arquivo:** [`tenant-payment.handler.ts`](file:///c:/Projetos/stock-manager/app/api/webhooks/mercadopago/_handlers/tenant-payment.handler.ts)

Contém dois caminhos completamente distintos num único `try`:
- **Caminho 4a (linha 91–135):** Resolve `SETTLED_LATER Sale` → Atualiza Sale para ACTIVE.
- **Caminho 4b (linha 137–207):** Resolve `PaymentIntent` → Cria Sale nova via `convertToSale`.

Cada caminho tem sua própria lógica de broadcast e auditoria, duplicada internamente.

**Recomendação:** Extrair para:
```
TenantPaymentWebhookHandler (orquestrador)
├── resolveSalePayment()          → Caminho 4a
├── resolvePaymentIntentPayment() → Caminho 4b
└── PaymentCompletionService      → Compartilhado com process-transparent-payment
```

### 1.3 ⚠️ `OrderService.convertToSale` — 170 linhas, God Method

**Arquivo:** [`order.ts`](file:///c:/Projetos/stock-manager/app/_services/order.ts#L251-L418)

Aceita **12 parâmetros posicionais** (!!):
```typescript
async convertToSale(
  orderIds, companyId, userId, paymentMethod,
  tipAmount, discountAmount, extraAmount,
  adjustmentReason, isEmployeeSale, status, dueDate, customerId
)
```

Isso é extremamente frágil. Trocar a ordem de `discountAmount` e `extraAmount` por engano compila sem erro e gera bugs financeiros silenciosos.

**Recomendação:** Converter para um objeto de input:
```typescript
interface ConvertToSaleInput {
  orderIds: string[];
  companyId: string;
  userId: string | null;
  paymentMethod: PaymentMethod | null;
  tipAmount?: number;
  discountAmount?: number;
  extraAmount?: number;
  // ... etc
  platformFeeRate?: number;    // ← Pronto para o Split
  platformFeeAmount?: number;  // ← Pronto para o Split
  externalPaymentId?: string;  // ← Pronto para o Split
}
```

### 1.4 ✅ `MercadoPagoGateway` — Bem isolado

**Arquivo:** [`mercadopago-gateway.ts`](file:///c:/Projetos/stock-manager/app/_services/payments/mercadopago-gateway.ts)

Implementa `IPaymentGateway` corretamente. Separação de responsabilidade bem feita. Não contém lógica de negócio.

### 1.5 ✅ `PaymentEventService` — Limpo e focado

**Arquivo:** [`payment-event.service.ts`](file:///c:/Projetos/stock-manager/app/_services/payments/payment-event.service.ts)

61 linhas, responsabilidade única (idempotência). Nada a refatorar.

---

## 2. Tipagem (TypeScript)

### 2.1 ❌ `any` explícito no payload do Bricks

```typescript
// process-transparent-payment.ts:17
bricksPayload: z.any(), // Raw payload from Mercado Pago Bricks onSubmit callback
```

O schema Zod aceita **literalmente qualquer coisa**. Se um atacante enviar um payload malformado, a validação não o impede.

**Recomendação:** Criar um schema discriminado por `paymentType`:
```typescript
const bricksPayloadSchema = z.object({
  paymentType: z.enum(["credit_card", "debit_card", "bank_transfer", "wallet_purchase"]),
  selectedPaymentMethod: z.string(),
  formData: z.record(z.unknown()), // Pelo menos valida que é um objeto
});
```

### 2.2 ❌ `any` nos retornos do Gateway

```typescript
// mercadopago-gateway.ts:88
getPayment(paymentId: string | number): Promise<any>;

// mercadopago-gateway.ts:93
createPayment(formData: any): Promise<any>;
```

**Impacto:** Qualquer código que chama `gateway.createPayment()` perde autocomplete e type safety. Se o MP mudar o formato da resposta, não teremos erro de compilação.

**Recomendação:** Criar tipos baseados na documentação oficial:
```typescript
interface IMercadoPagoPaymentResponse {
  id: number;
  status: "approved" | "pending" | "in_process" | "rejected";
  status_detail: string;
  external_reference?: string;
  point_of_interaction?: { transaction_data?: { qr_code_base64?: string; qr_code?: string } };
}
```

### 2.3 ❌ `any` no body da Preference

```typescript
// mercadopago.ts:34
const body: any = { items: params.items, ... };
```

Deveria usar `PreferenceCreateData` do SDK do MP.

### 2.4 ⚠️ `payload: body as any` no PaymentEventService

```typescript
// tenant-payment.handler.ts:132
await PaymentEventService.markAsProcessed({ ..., payload: body as any });
```

O `body` já é `IMercadoPagoWebhookBody`, que é `Json`-compatible. O `as any` é desnecessário e esconde possíveis incompatibilidades.

### 2.5 ⚠️ Raw SQL sem tipagem segura

```typescript
// analytics.ts:66
const results = await db.$queryRaw<{ revenue: number; cost: number; tips: number }[]>`...`;
```

A tipagem é manual e desacoplada da query real. Se alguém renomear a coluna no SQL e esquecer de atualizar o tipo, o TypeScript não detecta.

**Recomendação:** Sem solução perfeita (limitação do Prisma Raw), mas pode-se adicionar testes de integração que validem a estrutura do retorno.

---

## 3. Componentização (UI)

### 3.1 ⚠️ `OrdersTabGroup` — 244 linhas, muita lógica de estado

**Arquivo:** [`orders-tab-group.tsx`](file:///c:/Projetos/stock-manager/app/(public)/[companySlug]/my-orders/_components/orders-tab-group.tsx)

Concentra:
- Agrupamento de orders por status
- Cálculo de total da comanda
- Estado do checkout (preferenceId, amount, modal open/close)
- Handler de pagamento individual
- Handler de pagamento da comanda completa
- Lógica de escolha de provider

**Recomendação:** Extrair:
```
OrdersTabGroup (layout puro)
├── useCheckoutFlow()           → Hook customizado com toda a lógica de pagamento
├── ActiveOrdersTab             → Componente com lista + botão "Fechar Comanda"
├── PendingPaymentTab           → Componente com lista + botão "Pagar Agora"
└── CheckoutPaymentModal        → Já existe, está ok
```

### 3.2 ✅ `CheckoutPaymentModal` — 92 linhas, limpo

Componente bem focado. A única melhoria recente (que acabamos de aplicar hoje) foi o fix do layout Flex/dvh.

### 3.3 ✅ `MercadoPagoBricksForm` — 137 linhas, aceitável

Encapsula toda a interação com o SDK do Bricks. Responsabilidade única.

### 3.4 ⚠️ `SalesSummary` — Hardcoded e não extensível

```typescript
// sales-summary.tsx:73-107
<SummaryCard title="Faturamento" ... />
<SummaryCard title="Vendas" ... />
<SummaryCard title="Ticket Médio" ... />
<SummaryCard title="Lucro Bruto" ... />
```

Os 4 cards estão hardcoded. Para adicionar "Receita Líquida" ou "Taxa Kipo", é preciso editar diretamente. Não é dinâmico.

**Recomendação:** Converter para array de configuração:
```typescript
const metrics: SummaryCardConfig[] = [
  { key: "revenue", title: "Faturamento", icon: DollarSignIcon, ... },
  { key: "netRevenue", title: "Receita Líquida", icon: ..., visible: hasSplit },
  // ...
];
```

---

## 4. Duplicação e DRY

### 4.1 ❌ Lógica de "converter orders em Sale" duplicada em 2 lugares

| Local | O que faz |
|---|---|
| [`process-transparent-payment.ts`](file:///c:/Projetos/stock-manager/app/_actions/integration/process-transparent-payment.ts#L157-L194) | Se cartão é aprovado na hora: calcula gorjeta, chama `convertToSale`, faz broadcast. |
| [`tenant-payment.handler.ts`](file:///c:/Projetos/stock-manager/app/api/webhooks/mercadopago/_handlers/tenant-payment.handler.ts#L165-L207) | Webhook: calcula gorjeta, chama `convertToSale`, faz broadcast. |

**O cálculo da gorjeta é literalmente o mesmo código copiado:**
```typescript
// Ambos os arquivos:
const tipAmount = orders.reduce((sum, order) => {
  if (!order.hasServiceTax) return sum;
  const subtotal = order.orderItems.reduce(
    (s, item) => s + Number(item.unitPrice) * Number(item.quantity), 0
  );
  return sum + Math.round(subtotal * 0.1 * 100) / 100;
}, 0);
```

**Impacto para o Split:** Quando adicionarmos o cálculo da `platformFeeAmount`, teremos que atualizar **ambos os lugares**. Se esquecermos de um, teremos inconsistência financeira.

**Recomendação urgente:** Criar `PaymentCompletionService.completeOnlinePayment()` que encapsule:
1. Cálculo da gorjeta
2. Cálculo do platform fee (Split)
3. `convertToSale` com os snapshots
4. Broadcast para o cliente + KDS
5. Auditoria

### 4.2 ⚠️ `generate-mercadopago-checkout.ts` e `generate-pix-payment.ts` — 60% idênticos

Ambos:
1. Verificam integração ativa (mesma query)
2. Resolvem orderIds ou saleId (mesma lógica)
3. Calculam o total (mesma lógica)
4. Criam PaymentIntent (mesma query)

Diferença: um chama `createMercadoPagoPreference()` e o outro chama `gateway.generateDynamicPix()`.

**Recomendação:** Extrair `resolvePaymentContext()` que retorna `{ orderIds, amount, description, customerData, paymentIntent }`.

---

## 5. Resiliência e Manutenibilidade

### 5.1 ❌ Sem retry no Webhook

Se o `convertToSale` falha (ex: timeout do banco), o webhook retorna 500 e o Mercado Pago tentará reenviar. Porém, se o `PaymentEventService.markAsFailed()` também falhar, perderemos o registro.

**Recomendação:** Implementar dead-letter queue ou pelo menos um catch-all que grave o raw body num log persistente.

### 5.2 ❌ Sem estorno automático

O [`cancel-sale`](file:///c:/Projetos/stock-manager/app/_actions/sale/cancel-sale/index.ts) atualiza o banco e o estoque, mas **não chama** `payment.refund()` na API do MP. Se a venda foi online, o dinheiro fica com o restaurante mesmo após o cancelamento no sistema.

**Impacto para o Split:** Se implementarmos `application_fee` e depois o restaurante cancelar a venda, a Kipo ficará com a taxa mesmo devolvendo para o cliente. A API do MP automaticamente estorna a `application_fee` se você fizer o refund via API.

### 5.3 ⚠️ `convertToSale` sem validação de `paymentMethod`

Quando chamado pelo webhook, o `paymentMethod` é hardcoded como `"PIX"` ou `"CREDIT_CARD"`. Não há validação se o enum `PaymentMethod` do Prisma aceita esses valores. Funciona por coincidência.

### 5.4 ⚠️ Sem rate limiting no endpoint de webhook

O `POST /api/webhooks/mercadopago` não tem rate limiting. Um atacante poderia enviar milhares de chamadas e sobrecarregar o banco.

**Recomendação:** Adicionar rate limit via Upstash Redis (já disponível no projeto).

---

## 6. Priorização das Melhorias

| Prioridade | Item | Justificativa |
|---|---|---|
| 🔴 **P0** | Extrair `PaymentCompletionService` (DRY) | Pré-requisito para o Split. Sem isso, a taxa será calculada em 2+ lugares diferentes. |
| 🔴 **P0** | Converter `convertToSale` para Input Object | Segurança de tipos. Adicionar campos do Split sem risco de troca de parâmetros. |
| 🟡 **P1** | Tipar retornos do MercadoPagoGateway | Evitar bugs silenciosos em produção. |
| 🟡 **P1** | Implementar estorno via API do MP no `cancel-sale` | Obrigatório para cobrar `application_fee`. |
| 🟢 **P2** | Extrair `resolvePaymentContext()` | DRY entre checkout e pix. |
| 🟢 **P2** | Tipar `bricksPayload` com schema discriminado | Segurança. |
| 🟢 **P2** | Rate limiting no webhook | Segurança. |
| 🔵 **P3** | Componentizar `OrdersTabGroup` em hook + subcomponentes | Escalabilidade do frontend. |
| 🔵 **P3** | Tornar `SalesSummary` dinâmico | Extensibilidade para novos KPIs. |
