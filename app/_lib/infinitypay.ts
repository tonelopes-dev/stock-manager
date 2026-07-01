import "server-only";

interface InfinityPayItem {
  quantity: number;
  price: number; // centavos
  description: string;
}

interface InfinityPayCheckoutParams {
  handle: string;
  amount: number; // em reais, mas vamos transformar em centavos para os items
  description: string;
  order_nsu: string;
  webhook_url: string;
  redirect_url: string;
  customer?: {
    name: string;
    email?: string;
    phone_number?: string;
  };
}

/**
 * Cria o Checkout da InfinitePay fazendo um POST na API deles.
 */
export async function createInfinityPayCheckout(params: InfinityPayCheckoutParams): Promise<string> {
  // A InfinitePay espera os valores em centavos no Payload de items
  const priceInCents = Math.round(params.amount * 100);

  const payload = {
    handle: params.handle,
    redirect_url: params.redirect_url,
    webhook_url: params.webhook_url,
    order_nsu: params.order_nsu,
    customer: params.customer,
    items: [
      {
        quantity: 1,
        price: priceInCents,
        description: params.description || "Pedido KIPO"
      }
    ]
  };

  // A InfinitePay rejeita valores menores ou iguais a 1 centavo
  if (priceInCents <= 1) {
    throw new Error("O valor mínimo para pagamento online é R$ 0,02.");
  }

  console.log("[InfinityPay] Payload enviado:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[InfinityPay] Falha ao criar checkout:", response.status, errorText);
      throw new Error("Falha ao gerar link de pagamento na InfinitePay");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("[InfinityPay] Erro de rede/API:", error);
    throw new Error("Erro ao se comunicar com a InfinitePay");
  }
}
