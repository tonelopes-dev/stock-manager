"use server";

import { auth } from "@/app/_lib/auth";
import { mpClient } from "@/app/_lib/mercadopago";
import { Preference } from "mercadopago";
import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";

export const createMercadoPagoPreference = actionClient.action(async () => {
  const companyId = await getCurrentCompanyId();
  await assertRole(OWNER_ONLY);
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized: Email is required");
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
    },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  try {
    const preference = new Preference(mpClient);

    console.log("[MercadoPago] Creating preference for company:", companyId);
    console.log("[MercadoPago] Payer email:", session.user.email);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/checkout/success`;
    const failureUrl = `${baseUrl}/plans?error=true`;
    const pendingUrl = `${baseUrl}/checkout/pending`;

    console.log("[MercadoPago] URLs:", { successUrl, failureUrl, pendingUrl });

    const response = await preference.create({
      body: {
        items: [
          {
            id: "kipo-subscription-pro",
            title: "Assinatura Kipo Pro",
            unit_price: Number(process.env.MERCADO_PAGO_PRO_PRICE || "249"),
            quantity: 1,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: session.user.email,
        },
        external_reference: companyId,
        metadata: {
          companyId: companyId,
        },
        payment_methods: {
          excluded_payment_methods: [], // Garante que nenhum método (incluindo boleto) seja excluído
          installments: 1,
        },
        date_of_expiration: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },
        // auto_return: "approved", // Desativado temporariamente para isolar o erro de back_url.success
      },
    });

    console.log("[MercadoPago] Full Response:", JSON.stringify(response, null, 2));

    if (!response.init_point) {
      throw new Error("Failed to create Mercado Pago preference: Missing init_point");
    }

    return { url: response.init_point };
  } catch (error: any) {
    console.error("[MercadoPago] Error creating preference. Full Error Object:", JSON.stringify(error, null, 2));
    if (error.response) {
      console.error("[MercadoPago] Response error data:", JSON.stringify(error.response, null, 2));
    }
    throw new Error(`Mercado Pago Error: ${error.message || "Unknown error"}`);
  }
});
