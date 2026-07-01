# Débitos Técnicos e Refatorações Futuras

Este documento serve para rastrear decisões arquiteturais que precisaram de soluções temporárias ("gambiarras seguras") para agilizar a entrega, e que devem ser refatoradas no futuro.

## 1. Relação Sale (Venda) vs Order (Pedido)
**Data:** 30/06/2026 (Integração InfinitePay)

### O Problema
No Prisma Schema atual, a relação entre `Sale` e `Order` é **1-para-1**:
```prisma
model Sale {
  orderId        String?         @unique
  order          Order?          @relation(fields: [orderId], references: [id])
}
```
Na integração com a InfinitePay, surgiu a necessidade de agrupar vários `Orders` ativos de um cliente (uma Comanda) em um único pagamento online (`Sale`). Como o banco só aceita 1 `Order` por `Sale`, a solução adotada foi vincular a Venda apenas ao primeiro Pedido (`orders[0].id`). 

Para que o Webhook da InfinitePay soubesse quais eram os "outros" pedidos daquela venda e pudesse marcá-los como pagos, usamos o campo `adjustmentReason` dos pedidos secundários para salvar a string `"infinitypay_group_sale:<SALE_ID>"`. O Webhook busca por essa string para confirmar o pagamento.

### Como Refatorar (A Solução Ideal)
1. **Atualizar `schema.prisma`:**
   Mudar a relação para **1-para-N** (Uma venda tem muitos pedidos).
   - Remover `orderId` e `@unique` da tabela `Sale`.
   - Adicionar `saleId String?` e a relação `sale Sale? @relation(fields: [saleId], references: [id])` na tabela `Order`.

2. **Migração de Dados (CUIDADO CRÍTICO):**
   Antes de rodar a migração do Prisma que remove a coluna `orderId` de `Sale`, é necessário rodar um script SQL puro para copiar os dados:
   `UPDATE "Order" SET "saleId" = (SELECT id FROM "Sale" WHERE "Sale"."orderId" = "Order".id);`
   Sem isso, todo o histórico de vínculos entre Vendas e Pedidos no banco online será perdido.

3. **Ajustes no Código:**
   - Modificar `OrderService.convertToSale` para atualizar todos os `orders` com o `saleId`.
   - Modificar o `Webhook da InfinitePay` para varrer `sale.orders` nativamente em vez de buscar por `adjustmentReason`.
   - Modificar a action `generateInfinityPayCheckout` e componentes visuais que possam depender de `sale.order`.
