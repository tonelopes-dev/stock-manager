import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { z } from "zod";

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Endpoint inválido." },
        { status: 400 }
      );
    }

    const { endpoint } = parsed.data;

    await db.pushSubscription.deleteMany({
      where: { endpoint },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push Unsubscribe] Error:", error);
    return NextResponse.json(
      { error: "Erro interno ao remover subscription." },
      { status: 500 }
    );
  }
}
