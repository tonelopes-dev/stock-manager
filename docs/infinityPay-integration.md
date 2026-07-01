# Integração Checkout InfinitePay - Guia para IA

## Objetivo

Implementar integração com o Checkout da InfinitePay utilizando geração de links de pagamento, redirecionamento do cliente para o checkout hospedado pela InfinitePay e processamento de notificações via webhook.

A integração deve ser simples, segura e desacoplada do frontend.

---

# Visão Geral do Fluxo

```text
Cliente realiza pedido
        ↓
Backend cria pedido interno
        ↓
Backend envia requisição para InfinitePay
        ↓
InfinitePay retorna URL do Checkout
        ↓
Frontend redireciona usuário
        ↓
Cliente realiza pagamento
        ↓
InfinitePay envia webhook
        ↓
Backend confirma pagamento
        ↓
Pedido é aprovado
```

---

# Conceitos Importantes

## Handle

É a InfiniteTag da conta.

Exemplo:

```text
$tonelopes
```

Enviar apenas:

```text
tonelopes
```

Sem o símbolo "$".

---

## order_nsu

Identificador único do pedido no sistema.

Exemplo:

```text
ORD-2026-0001
```

ou

```text
f4b6aef5-9e7c-4f65-9b68-abc123456789
```

Esse valor será retornado posteriormente pelo webhook.

---

## redirect_url

URL para onde o usuário será enviado após concluir o pagamento.

Exemplo:

```text
https://meusite.com/pagamento/sucesso
```

---

## webhook_url

Endpoint responsável por receber atualizações da InfinitePay.

Exemplo:

```text
https://api.meusite.com/webhooks/infinitepay
```

---

# Endpoint Principal

## Criar Checkout

### Método

```http
POST https://api.checkout.infinitepay.io/links
```

---

# Payload de Criação

## Exemplo

```json
{
  "handle": "tonelopes",
  "redirect_url": "https://meusite.com/sucesso",
  "webhook_url": "https://api.meusite.com/webhook/infinitepay",
  "order_nsu": "ORD-123456",
  "items": [
    {
      "quantity": 1,
      "price": 1000,
      "description": "Curso de React"
    }
  ]
}
```

---

# Campos

| Campo        | Tipo   | Obrigatório |
| ------------ | ------ | ----------- |
| handle       | string | Sim         |
| redirect_url | string | Sim         |
| webhook_url  | string | Sim         |
| order_nsu    | string | Sim         |
| items        | array  | Sim         |

---

# Estrutura dos Itens

```json
{
  "quantity": 1,
  "price": 1000,
  "description": "Curso de React"
}
```

## Observações

### quantity

Quantidade do item.

```json
1
```

---

### price

Valor em centavos.

Exemplos:

```json
1000
```

= R$ 10,00

```json
5990
```

= R$ 59,90

```json
19990
```

= R$ 199,90

---

### description

Descrição do produto.

```json
"Curso de React"
```

---

# Resposta Esperada

```json
{
  "url": "https://checkout.infinitepay.com.br/abc123"
}
```

---

# Fluxo Após Receber a URL

O backend deve retornar a URL para o frontend.

Exemplo:

```json
{
  "checkoutUrl": "https://checkout.infinitepay.com.br/abc123"
}
```

O frontend deve redirecionar:

```javascript
window.location.href = checkoutUrl;
```

---

# Exemplo Node.js com Fetch

```javascript
const response = await fetch(
  "https://api.checkout.infinitepay.io/links",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      handle: "tonelopes",
      redirect_url: "https://meusite.com/sucesso",
      webhook_url: "https://api.meusite.com/webhook/infinitepay",
      order_nsu: "ORD-123456",
      items: [
        {
          quantity: 1,
          price: 9900,
          description: "Plano Premium"
        }
      ]
    })
  }
);

const data = await response.json();
```

---

# Exemplo com Axios

```javascript
const axios = require("axios");

const response = await axios.post(
  "https://api.checkout.infinitepay.io/links",
  {
    handle: "tonelopes",
    redirect_url: "https://meusite.com/sucesso",
    webhook_url: "https://api.meusite.com/webhook/infinitepay",
    order_nsu: "ORD-123456",
    items: [
      {
        quantity: 1,
        price: 9900,
        description: "Plano Premium"
      }
    ]
  }
);

const checkoutUrl = response.data.url;
```

---

# Webhook

Após o pagamento a InfinitePay enviará uma requisição POST para a URL configurada.

---

## Exemplo de Payload

```json
{
  "invoice_slug": "abc123",
  "amount": 1000,
  "paid_amount": 1010,
  "installments": 1,
  "capture_method": "credit_card",
  "transaction_nsu": "UUID",
  "order_nsu": "ORD-123456",
  "receipt_url": "https://comprovante.com/123",
  "items": [
    {
      "quantity": 1,
      "price": 1000,
      "description": "Curso de React"
    }
  ]
}
```

---

# Campos Recebidos no Webhook

| Campo           | Descrição           |
| --------------- | ------------------- |
| invoice_slug    | ID da cobrança      |
| amount          | Valor original      |
| paid_amount     | Valor pago          |
| installments    | Parcelas            |
| capture_method  | Método de pagamento |
| transaction_nsu | ID da transação     |
| order_nsu       | ID do pedido        |
| receipt_url     | URL do comprovante  |
| items           | Produtos vendidos   |

---

# Métodos de Pagamento

## PIX

```json
{
  "capture_method": "pix"
}
```

---

## Cartão

```json
{
  "capture_method": "credit_card"
}
```

---

# Endpoint de Webhook (Next.js)

```javascript
export async function POST(request) {
  const body = await request.json();

  const orderId = body.order_nsu;

  await updateOrder(orderId, {
    status: "PAID",
    transactionId: body.transaction_nsu,
    receiptUrl: body.receipt_url
  });

  return Response.json(
    { success: true },
    { status: 200 }
  );
}
```

---

# Resposta Obrigatória do Webhook

A InfinitePay espera:

```http
200 OK
```

Caso contrário ela tentará reenviar o evento.

---

# Regras de Negócio Recomendadas

## Ao criar checkout

Salvar:

```text
order_nsu
status = PENDING
created_at
```

---

## Ao receber webhook

Atualizar:

```text
status = PAID
paid_at
transaction_nsu
receipt_url
```

---

## Evitar Processamento Duplicado

Antes de atualizar:

```sql
SELECT * FROM orders
WHERE order_nsu = ?
```

Se já estiver:

```text
PAID
```

ignorar processamento.

---

# Estrutura Recomendada da Tabela

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_nsu VARCHAR(255) UNIQUE,
  amount INTEGER,
  status VARCHAR(50),
  transaction_nsu VARCHAR(255),
  receipt_url TEXT,
  created_at TIMESTAMP,
  paid_at TIMESTAMP
);
```

---

# Boas Práticas

1. Nunca confiar apenas no redirect_url.
2. Considerar pagamento confirmado somente via webhook.
3. Utilizar order_nsu único.
4. Registrar logs de todas as notificações.
5. Tornar o webhook idempotente.
6. Validar todos os campos recebidos.
7. Salvar payload completo para auditoria.
8. Implementar tratamento de erros e retries.

---

# Resultado Esperado

Ao final da integração:

* Cliente conclui compra no sistema.
* Backend gera checkout na InfinitePay.
* Usuário é redirecionado para pagamento.
* InfinitePay processa PIX ou cartão.
* Webhook confirma a transação.
* Pedido é atualizado automaticamente para pago.
* Sistema libera produto, acesso ou serviço.

Fim da documentação.
