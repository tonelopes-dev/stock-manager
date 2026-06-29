import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { z } from "zod";

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  customerId: z.string().min(1),
  companyId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 }
      );
    }

    const { subscription, customerId, companyId } = parsed.data;

    // Upsert: if endpoint already exists, update keys; otherwise create
    await db.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        customerId,
        companyId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        customerId,
        companyId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[Push Subscribe] Error:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar subscription." },
      { status: 500 }
    );
  }
}
