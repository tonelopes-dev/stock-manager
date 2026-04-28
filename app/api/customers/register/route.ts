import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phoneNumber, companyId } = body;

    if (!name || !phoneNumber || !companyId) {
      return NextResponse.json(
        { success: false, message: "Parâmetros ausentes" },
        { status: 400 }
      );
    }

    // Cria o cliente
    const customer = await db.customer.create({
      data: {
        name,
        phone: phoneNumber,
        companyId,
        source: "MENU", // Ajustado para o enum CustomerSource
        isActive: true,
        position: 0,
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        customerId: customer.id,
        name: customer.name,
        phoneNumber: customer.phone,
      },
    });
  } catch (error: any) {
    console.error("Erro ao registrar cliente:", error);
    
    // Verifica se é erro de duplicidade (embora o check deva evitar isso)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: "Já existe um cliente com este telefone nesta empresa." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Erro ao realizar cadastro" },
      { status: 500 }
    );
  }
}
