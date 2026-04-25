import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const companyId = searchParams.get("companyId");

  if (!phone || !companyId) {
    return NextResponse.json({ error: "Parâmetros ausentes" }, { status: 400 });
  }

  try {
    // Busca o cliente pelo telefone e ID da empresa
    const customer = await db.customer.findFirst({
      where: {
        phone: phone,
        companyId: companyId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      customer: {
        customerId: customer.id,
        name: customer.name,
        phoneNumber: customer.phone,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar cliente:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
