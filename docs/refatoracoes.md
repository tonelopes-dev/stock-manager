# Documento de Refatorações (Débitos Técnicos)

Este documento centraliza as soluções temporárias (gambiarras seguras) e débitos técnicos que precisam ser refatorados no futuro para garantir a escalabilidade e a limpeza da arquitetura.

## 1. Agrupamento de Pedidos (Comandas) na Integração InfinitePay
**Local:** `app/_actions/integration/generate-infinitypay-checkout.ts` e `app/api/webhooks/infinitypay/route.ts`

**O Problema:**
O banco de dados atual não possui uma entidade `Comanda` ou `PaymentIntent` para agrupar múltiplos `Order` (pedidos) em uma única transação pendente, a menos que convertamos os pedidos prematuramente em uma entidade `Sale`. Porém, criar a `Sale` antes do pagamento confirmado remove os pedidos da aba "Abertas" (PDV), causando confusão para a operação do restaurante.

**A Gambiarra Segura Atual:**
- Ao gerar o link de pagamento, usamos o ID do **primeiro pedido** (`orders[0].id`) como o identificador único (`order_nsu`) enviado para a InfinitePay.
- Os demais pedidos dessa comanda são "linkados" ao pedido principal atualizando o campo `adjustmentReason` para `infinitypay_group_order:<id_do_pedido_principal>`.
- O webhook, ao receber a confirmação de pagamento do `order_nsu`, busca esse pedido principal e usa o `adjustmentReason` para encontrar todos os outros pedidos vinculados.
- Somente então, o webhook chama o `OrderService.convertToSale` transformando todos os pedidos pagos em uma única `Sale` (Venda) no banco.

**Como Refatorar:**
- Criar um modelo `PaymentIntent` ou `ComandaCheckout` no Prisma:
  ```prisma
  model PaymentIntent {
    id            String   @id @default(cuid())
    companyId     String
    customerId    String?
    amount        Decimal
    status        String   // PENDING, PAID, EXPIRED
    orderIds      String[] // Array de IDs de pedidos
    provider      String   // INFINITYPAY
    transactionId String?
    createdAt     DateTime @default(now())
  }
  ```
- O `order_nsu` enviado à integração passaria a ser o ID desse `PaymentIntent`.
- O webhook processaria o `PaymentIntent`, buscaria os `OrderIds` associados no array, e chamaria o `convertToSale` de forma muito mais elegante, eliminando a dependência do campo string `adjustmentReason`.

## 2. Abstração de Gateways de Pagamento
**Local:** Diretório `app/_lib/` e `app/api/webhooks/`

**O Problema:**
Atualmente, as chamadas para a InfinitePay (ex: `createInfinityPayCheckout`) e o recebimento de webhooks estão fortemente acoplados aos casos de uso.

**A Gambiarra Segura Atual:**
- A integração foi feita especificamente para o provider INFINITYPAY com lógicas hardcoded (`isApproved = status === "approved" || status === "paid"`).
- O webhook é específico `route.ts` dentro de `infinitypay`.

**Como Refatorar:**
- Criar o padrão de projeto `Strategy` para pagamentos. Uma interface `PaymentGateway` com métodos padrão `createCheckout()` e `handleWebhook()`.
- Facilitaria plugar outros gateways futuros como Stripe ou Mercado Pago para pedidos locais, abstraindo a diferença de payloads.
