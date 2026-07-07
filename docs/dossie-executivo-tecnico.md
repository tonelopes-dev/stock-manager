# Dossiê Executivo e Técnico — Kipo: da Gestão à Fintech

> **Classificação:** Interno — Liderança Técnica e Produto
> **Autoria:** Arquitetura de Software — Kipo CTO Office
> **Versão:** 1.0 — Julho 2026
> **Status:** Living Document (atualizar a cada Sprint de Milestone)

---

## Sumário Executivo

O Kipo nasceu como um sistema de gestão (SaaS). A próxima fase da empresa é se tornar uma **rodovia financeira** do bar e restaurante — onde cada transação paga, estornada ou parcelada passa por dentro da plataforma e pode gerar margem para o Kipo via **Take Rate (Split)**.

Esta transformação não é apenas técnica. É a diferença entre uma empresa de software que cobra assinatura e uma Fintech que cresce em receita proporcional ao volume de vendas dos seus clientes — o mesmo modelo que transformou o Mercado Pago, Stone e iFood em unicórnios.

---

## Pilar 1: Raio-X do Momento Atual

### 1.1 Estado da Arquitetura

A stack atual do Kipo representa um salto significativo de maturidade:

| Camada | Tecnologia | Status |
|---|---|---|
| Framework | Next.js 16 (App Router, Server Actions) | ✅ Produção |
| Banco de Dados | PostgreSQL via Supabase | ✅ Produção |
| ORM | Prisma 5.19 | ✅ Produção |
| Realtime | Supabase Broadcast (WebSocket) | ✅ Implementado |
| Auth | NextAuth v5 + RBAC granular | ✅ Produção |
| Multi-tenancy | `companyId` em todas as queries | ✅ Produção |
| Pagamentos Online | Mercado Pago (Bricks + PIX Dinâmico) | ✅ Implementado |
| Pagamentos Online | InfinitePay (Checkout Link) | ✅ Implementado |
| Fiscal | NFC-e / SAT | ❌ Não iniciado |
| Impressão | Impressora Térmica na Nuvem | ❌ Não iniciado |
| Offline | PWA + Service Worker + IndexedDB | ⚠️ PWA parcial (sem offline real) |
| CMV Exato | Ficha Técnica N:N Ingrediente-Produto | ⚠️ ProductComposition existe (auto-referência) |
| Maquininha | Point API (MP) | ⚠️ Interface definida, não implementada |

### 1.2 Destaques Técnicos da Refatoração Recente

#### Realtime via Broadcast (sem polling)

O KDS e o PDV agora se comunicam via Supabase Realtime Broadcast:

```
Webhook MP → tenant-payment.handler.ts
  → broadcastKdsEvent({ channel: `company-${companyId}`, type: 'PAYMENT_CONFIRMED' })
  → usePaymentRealtime() no cliente escuta e fecha a UI
```

- **Vantagem:** Zero polling. Latência < 300ms. Sem custo adicional de servidor.
- **Ponto de atenção:** O canal usa `channelId = companyId`. Em alta concorrência (50+ mesas), considerar sharding por `tableNumber`.

#### Segurança em Banco de Dados

O modelo atual opera em duas camadas:

1. **Application-level:** Todo `prisma.model.findMany` exige `where: { companyId }`.
2. **Recomendação futura:** Habilitar RLS no Supabase nas tabelas críticas como segunda linha de defesa.

#### Arquitetura de Pagamentos (estado atual)

```
CompanyIntegration (Prisma)
  └── credentials: Json { accessToken, publicKey } (plano texto — ver ADR-001)

PaymentIntent (Prisma)
  └── externalId → preferenceId do MP / pixPaymentId
  └── amount → source of truth do valor (server-side)

PaymentEvent (Prisma)
  └── Idempotência: evita duplicação de webhook
```

### 1.3 Fortalezas Competitivas vs. Concorrência

| Feature | Kipo | Consumer | Goomer | KCMS |
|---|---|---|---|---|
| Mobile-first KDS em tempo real | ✅ Broadcast | ⚠️ Polling | ✅ | ⚠️ |
| Checkout sem sair da tela (Bricks) | ✅ | ❌ (redirect) | ❌ | ❌ |
| PIX Dinâmico com QR no PDV | ✅ | ❌ | ❌ | ❌ |
| Multi-gateway (MP + InfinitePay) | ✅ | ⚠️ Parcial | ❌ | ❌ |
| RBAC granular por operador | ✅ | ⚠️ | ❌ | ✅ |
| PWA instalável | ✅ | ❌ | ✅ | ❌ |
| Ficha Técnica CMV | ⚠️ | ❌ | ❌ | ✅ |

**Vantagem diferencial:** O Kipo é o único sistema deste segmento com checkout transparente (sem redirect) + PIX dinâmico gerado dentro do PDV. Isso reduz o tempo de checkout de ~3 minutos (redirect + app externo) para ~30 segundos (mostrar QR > cliente scannea > fechamento automático).

---

## Pilar 2: Motor Financeiro (Pagamentos e Take Rate)

### 2.1 Arquitetura de Checkout no Cardápio Digital (/my-orders)

#### Modalidade A: Checkout Transparente (Mercado Pago Bricks)

```
Cliente (mobile /my-orders)
  → Clica "Pagar"
  → CheckoutPaymentModal (Sheet bottom)
      → generateMercadoPagoCheckout() [Server Action]
          → MercadoPagoGateway.createCheckout()
          → Salva PaymentIntent { status: PENDING, externalId: preference_id }
          → Retorna { publicKey, preferenceId, amount }
      → MercadoPagoBricksForm monta o Payment Brick
          → Cliente escolhe cartão/pix/saldo
          → onSubmit() → processTransparentPayment() [Server Action]
              → Busca PaymentIntent no DB (source of truth do valor)
              → Injeta { transaction_amount, external_reference }
              → gateway.createPayment(finalPayload)
  → Webhook chega em /api/webhooks/mercadopago
      → tenant-payment.handler.ts
          → Verifica idempotência (PaymentEvent)
          → Atualiza Sale.status → ACTIVE, Order.status → PAID
          → broadcastKdsEvent() → KDS fecha em tempo real
```

#### Modalidade B: PIX Integrado (PDV do operador)

```
Operador (PDV /sales)
  → Seleciona "PIX Integrado" na comanda
  → handlePay() → convertOrderToSaleAction() [status: PENDING_PAYMENT]
  → generatePixPayment() [Server Action]
      → MercadoPagoGateway.generateDynamicPix()
      → Retorna { qrCodeBase64, copyPasteCode }
  → PixPaymentDisplay exibe QR Code + botão copiar
  → usePaymentRealtime() escuta Broadcast
  → Webhook confirma → Broadcast → sheet fecha automaticamente
```

### 2.2 Processamento de Webhooks em Tempo Real

O handler `tenant-payment.handler.ts` implementa o padrão **Saga Assíncrona com Idempotência**:

```typescript
async function handleTenantPayment(paymentId, companyId) {
  // 1. Idempotência — nunca processa duas vezes
  const existing = await PaymentEventService.isAlreadyProcessed(paymentId);
  if (existing) return { alreadyProcessed: true };

  // 2. Busca o pagamento no MP com o token do lojista
  const payment = await gateway.getPayment(paymentId);
  if (payment.status !== 'approved') return;

  // 3. Atualiza DB em transação atômica
  await db.$transaction([
    db.sale.update({ where: { id: saleId }, data: { status: 'ACTIVE' } }),
    db.order.updateMany({ where: { id: { in: orderIds } }, data: { status: 'PAID' } }),
    db.paymentEvent.create({ ... }),
  ]);

  // 4. Broadcast para o KDS (Supabase Realtime)
  await broadcastKdsEvent({ type: 'PAYMENT_CONFIRMED', ... });
}
```

### 2.3 Take Rate (Split de Pagamentos) — Preparação

#### Campos a adicionar no banco

```prisma
model Company {
  // Identificadores para o Take Rate (Marketplace Split MP)
  mpMarketplaceAccountId  String?  // OAuth user ID do lojista no MP
  mpMarketplaceToken      String?  // Access Token do lojista via marketplace flow
  kipoMarketplaceFeeRate  Decimal? @db.Decimal(5, 4) // ex: 0.0150 = 1.5%
}
```

#### Campos no payload de pagamento

```typescript
// gateway.createCheckout() — com split
body: {
  items: [...],
  marketplace: process.env.MP_MARKETPLACE_ID,      // ID do App Kipo no MP
  marketplace_fee: Math.round(amount * kipoFeeRate * 100) / 100,
  // O restante vai automaticamente para a conta do lojista
}
```

#### Roadmap do Split

| Etapa | Esforço | Impacto |
|---|---|---|
| 1. Fluxo OAuth de conexão da conta MP | 2 sprints | Pré-requisito |
| 2. Salvar `mpMarketplaceAccountId` em `Company` | 0.5 sprint | Pré-requisito |
| 3. Injetar `marketplace_fee` no payload | 0.5 sprint | ✅ Gera receita |
| 4. Dashboard de Take Rate (relatório de fees) | 1 sprint | Visibilidade |
| 5. Compliance MP Marketplace (aprovação MP Brasil) | 4-8 semanas | Blocker regulatório |

---

## Pilar 3: Gaps Competitivos e Infraestrutura Física

### 3.1 NFC-e / Fiscal

#### Arquitetura Recomendada (Next.js + Focus NFe)

Emissão em background, após pagamento confirmado, sem bloquear o fluxo de caixa:

```
Webhook MP confirma pagamento
  → tenant-payment.handler.ts
      → [NOVO] emitirNFCe(saleId)
          → Busca Sale + Company + SaleItems
          → Monta payload SEFAZ (DANFE)
          → POST https://api.focusnfe.com.br/v2/nfce
          → Salva NFCe.accessKey e NFCe.danfeUrl no banco
```

#### Schema a adicionar

```prisma
model FiscalDocument {
  id             String   @id @default(cuid())
  companyId      String
  saleId         String   @unique
  type           String   // "NFCE" | "SAT"
  accessKey      String?  // Chave de acesso 44 dígitos
  danfeUrl       String?  // URL do PDF para impressão
  status         String   // "PENDING" | "AUTHORIZED" | "REJECTED" | "CANCELLED"
  payload        Json     // Payload enviado à SEFAZ (para reprocessamento)
  rejectionCode  String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### Dados Fiscais por Empresa

```prisma
model Company {
  taxId           String?  // CNPJ
  stateRegId      String?  // Inscrição Estadual
  cityRegId       String?  // Inscrição Municipal
  taxRegime       String?  // "SN" | "LP" | "LR"
  fiscalApiKey    String?  // Chave da Focus NFe (criptografada)
  fiscalEnabled   Boolean  @default(false)
  fiscalSerie     Int      @default(1)
  fiscalNextNum   Int      @default(1)
}
```

#### Comparativo de Provedores

| Provedor | Preço | Diferencial |
|---|---|---|
| Focus NFe | ~R$ 0,10/nota | Mais popular, docs excelentes |
| eNotas | ~R$ 0,15/nota | Mais estados suportados |
| NF-e.io | ~R$ 0,08/nota | API moderna, webhook nativo |

### 3.2 Impressoras Térmicas

#### Opção A: Print Agent Local via Broadcast (Recomendado para MVP)

```
Next.js (cloud) → Supabase Broadcast → Print Agent (Electron.js local)
                                              ↓
                                    Impressora Térmica Wi-Fi (192.168.x.x)
```

Um app Electron.js simples rodando na máquina do bar escuta o canal Broadcast e envia o conteúdo via ESC/POS (protocolo padrão de impressoras térmicas).

- **Custo de desenvolvimento:** 2-3 sprints
- **Hardware recomendado:** Epson TM-T20 (~R$ 400), Bematech MP-4200 TH (~R$ 350)

#### Opção B: PrintNode SaaS

```
Next.js → POST api.printnode.com/printjobs → PrintNode Agent local → Impressora
```

- **Custo:** $9/mês por conta (ilimitado de impressoras)
- **Prós:** Zero infraestrutura. Funciona no Windows.
- **Contras:** Dependência de terceiro.

### 3.3 Modo Offline (PWA)

#### Estado Atual

O Kipo é instalável como PWA, mas sem Service Worker de cache de dados. Se a internet cair:
- ❌ Garçom não consegue abrir o cardápio
- ❌ Novo pedido não pode ser registrado
- ❌ KDS para de receber atualizações

#### Arquitetura de Implementação

**Fase 1 — Cache Estático (Workbox):** App abre mesmo sem internet.

**Fase 2 — Cache de Dados (Dexie + IndexedDB):**

```typescript
// lib/offline-db.ts
const db = new Dexie('KipoOfflineDB');
db.version(1).stores({
  products:       '++id, companyId, name, categoryId',
  orders:         '++id, companyId, status, createdAt',
  pendingActions: '++id, type, payload, createdAt', // Fila de sincronização
});
```

**Fase 3 — Background Sync:**

```typescript
// Service Worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-orders') {
    event.waitUntil(flushPendingQueue());
  }
});
```

**Operações offline permitidas:** Criar pedido, adicionar item, ver cardápio.
**Operações que precisam de internet:** Processar pagamento, cancelar venda.

---

## Pilar 4: Backoffice e Segurança

### 4.1 Ficha Técnica e CMV

#### Estado Atual

`ProductComposition` (auto-referência em `Product`) cobre composição de produtos. O campo `SaleItem.baseCost` já captura o custo em snapshot no momento da venda — a base do CMV já existe.

#### O que Falta

**1. Custo Médio Ponderado (CMP):**

```prisma
model Product {
  averageCost  Decimal @default(0) @db.Decimal(10, 4) // Calculado a cada StockEntry
}
```

Recálculo a cada entrada de estoque:
```
novoCMP = (estoqueAtual × cmpAtual + novaQtd × novoCusto) / (estoqueAtual + novaQtd)
```

**2. Relatório de CMV em SQL:**

```sql
SELECT
  DATE_TRUNC('month', s.date)                              AS month,
  SUM(si.total_cost)                                        AS cmv_total,
  SUM(si.total_amount)                                      AS revenue_total,
  (SUM(si.total_cost) / NULLIF(SUM(si.total_amount), 0) * 100) AS cmv_pct
FROM "SaleProduct" si
JOIN "Sale" s ON si.sale_id = s.id
WHERE s.company_id = $1
  AND s.status = 'ACTIVE'
  AND s.date BETWEEN $2 AND $3
GROUP BY 1
ORDER BY 1;
```

### 4.2 Auditoria Anti-Fraude

#### Estado Atual

`AuditEvent` já tem 25 tipos mapeados e é populado para eventos críticos.

#### O que Falta

**1. Novos tipos de evento:**

```prisma
enum AuditEventType {
  // ... tipos existentes
  SALE_REFUNDED         // Estorno processado
  ORDER_ITEM_DELETED    // Item deletado da comanda
  PAYMENT_REVERSED      // Chargeback recebido
  DISCOUNT_APPLIED      // Desconto acima de threshold
  OPERATOR_OVERRIDE     // Supervisor aprovou ação sensível
}
```

**2. Regras de Fraude Automáticas:**

```typescript
const FRAUD_RULES = [
  { type: 'HIGH_DISCOUNT',    threshold: 0.30, severity: 'WARNING'  }, // Desconto > 30%
  { type: 'FREQUENT_CANCELS', count: 3, window: '1h', severity: 'CRITICAL' },
  { type: 'AFTER_HOURS_SALE', hours: [0, 6], severity: 'INFO' },
  { type: 'LARGE_REFUND',     amount: 500, severity: 'CRITICAL' },
];

// Ao detectar, notificar o OWNER via push notification
await NotificationService.notify({
  companyId,
  title: '⚠️ Atividade suspeita detectada',
  message: `Operador ${actorName} aplicou desconto de 45% na comanda #${orderId}`,
  type: 'FRAUD_ALERT',
});
```

---

## Pilar 5: Roadmap Rumo ao Sucesso

### Fase 1 — Curto Prazo: Foco no Dinheiro (0-3 meses)

| # | Tarefa Técnica | Esforço | Prioridade |
|---|---|---|---|
| 1.1 | Fluxo OAuth MP Marketplace (autorizando conta do lojista) | 2 sprints | 🔴 Alta |
| 1.2 | Salvar `mpMarketplaceAccountId` em `Company` | 0.5 sprint | 🔴 Alta |
| 1.3 | Injetar `marketplace_fee` no payload de checkout | 0.5 sprint | 🔴 Alta |
| 1.4 | Maquininha Point API (MP) — Fase 4 do roadmap de pagamentos | 3 sprints | 🔴 Alta |
| 1.5 | Criptografia de credenciais em `CompanyIntegration.credentials` (AES-256) | 1 sprint | 🟡 Média |
| 1.6 | Dashboard de transações por gateway (relatório financeiro do lojista) | 1 sprint | 🟡 Média |
| 1.7 | `npx tsc --noEmit` no CI/CD (GitHub Actions) antes de todo deploy | 0.5 sprint | 🟡 Média |
| 1.8 | Suporte a parcelamento no Brick (exibir parcelas ao cliente) | 0.5 sprint | 🟢 Baixa |

**Meta:** Primeiro lojista processando pagamento via Kipo com take rate aplicado.

### Fase 2 — Médio Prazo: Foco na Gestão (3-6 meses)

| # | Tarefa Técnica | Esforço | Prioridade |
|---|---|---|---|
| 2.1 | Custo Médio Ponderado: cálculo automático em `StockEntry` | 1 sprint | 🔴 Alta |
| 2.2 | Relatório de CMV por período (UI no dashboard) | 1 sprint | 🔴 Alta |
| 2.3 | Print Agent (Electron.js) com suporte a ESC/POS via Broadcast | 3 sprints | 🔴 Alta |
| 2.4 | Suporte a impressora Wi-Fi local (Epson TM-T20) | 1 sprint | 🔴 Alta |
| 2.5 | Regras de fraude automáticas + alertas push ao OWNER | 1 sprint | 🟡 Média |
| 2.6 | `AuditEventType` expandido (SALE_REFUNDED, DISCOUNT_APPLIED, etc.) | 0.5 sprint | 🟡 Média |
| 2.7 | Ficha Técnica avançada: variação de custo por lote (FIFO/CMP) | 2 sprints | 🟡 Média |
| 2.8 | Integração Focus NFe (NFC-e em background após pagamento) | 2 sprints | 🟢 Baixa |

**Meta:** CMV real no dashboard. Impressão automática no caixa e na cozinha.

### Fase 3 — Longo Prazo: Foco em Escala e Resiliência (6-12 meses)

| # | Tarefa Técnica | Esforço | Prioridade |
|---|---|---|---|
| 3.1 | Service Worker + Workbox: cache estático offline | 1 sprint | 🔴 Alta |
| 3.2 | IndexedDB com Dexie: products, orders offline | 2 sprints | 🔴 Alta |
| 3.3 | Fila de sincronização (Background Sync API) | 2 sprints | 🔴 Alta |
| 3.4 | Conflict Resolution: pedido offline que colide com pedido online | 1 sprint | 🟡 Média |
| 3.5 | RLS no Supabase nas tabelas críticas (segunda camada de segurança) | 1 sprint | 🟡 Média |
| 3.6 | Redis (Upstash): cache de relatórios pesados + rate limiting de webhooks | 1 sprint | 🟡 Média |
| 3.7 | Sharding de Broadcast por mesa (alta concorrência) | 1 sprint | 🟢 Baixa |
| 3.8 | Integração iFood (sync de pedidos iFood → KDS Kipo) | 4 sprints | 🟢 Baixa |
| 3.9 | Multi-moeda / internacionalização (expansão regional) | 3 sprints | 🟢 Baixa |

**Meta:** Kipo opera em restaurante com 200+ mesas sem degradação. Garçom tira pedido offline e sincroniza quando sinal volta.

---

## Decisões Arquiteturais Pendentes (ADRs)

### ADR-001: Criptografia de Credenciais de Integração

**Status:** Pendente
**Problema:** `CompanyIntegration.credentials` armazena o `accessToken` do MP em texto plano no PostgreSQL.
**Solução:** AES-256-GCM com chave mestra (`INTEGRATION_ENCRYPTION_KEY` em env).

```typescript
// lib/crypto.ts
import { createCipheriv, randomBytes } from 'crypto';

export function encryptCredentials(data: object): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    'aes-256-gcm',
    Buffer.from(process.env.INTEGRATION_ENCRYPTION_KEY!, 'hex'),
    iv
  );
  // ...
}
```

**Impacto:** Alto (segurança). Baixo (esforço — 1 sprint).

### ADR-002: Webhook Resiliente com Buffer Redis

**Status:** Em Produção (básico)
**Problema:** Se o banco estiver indisponível quando o webhook chegar, a transação é perdida.
**Solução:** Upstash Redis como buffer. O endpoint retorna 200 imediatamente e enfileira. Um Vercel Cron processa a fila.

### ADR-003: Modelo de Ingrediente Dedicado vs. Produto Insumo

**Status:** Pendente
**Problema:** Usar `Product` com `type = INSUMO` mistura dois domínios (venda e custeio).
**Solução:** Criar modelo `Ingredient` separado com relação `ProductIngredient` (N:N com quantidade e unidade).
**Impacto:** Migration + refatoração do `ProductComposition`. Alto esforço (2 sprints).

---

## Métricas de Saúde do Sistema

| Métrica | Target | Ferramenta |
|---|---|---|
| Webhook delivery rate | > 99.5% | Sentry + Logs |
| Latência P95 do checkout | < 2s | Vercel Analytics |
| Uptime | > 99.9% | UptimeRobot |
| Latência Realtime (Broadcast) | < 500ms | Custom metrics |
| CMV vs. estoque físico (desvio) | < 3% | Relatório mensal |
| Chargeback rate | < 0.5% | Painel MP |

---

*Documento gerado em Julho de 2026. Revisar na próxima Planning de Milestone.*
