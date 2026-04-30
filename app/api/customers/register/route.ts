import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phoneNumber, email, birthDate, imageUrl, companyId } = body;

    if (!name || !phoneNumber || !companyId) {
      return NextResponse.json(
        { success: false, message: "Parâmetros ausentes" },
        { status: 400 }
      );
    }

    const customer = await db.$transaction(async (tx) => {
      // 1. Verificar se o cliente já existe por telefone
      const existingCustomer = await tx.customer.findUnique({
        where: {
          phone_companyId: {
            phone: phoneNumber,
            companyId,
          },
        },
      });

      if (existingCustomer) {
        // Se existe, atualizamos apenas campos que estavam nulos
        return await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: existingCustomer.name || name,
            imageUrl: existingCustomer.imageUrl || imageUrl,
            email: existingCustomer.email || email,
            birthday: existingCustomer.birthday || (birthDate ? new Date(birthDate) : undefined),
          },
        });
      }

      // 2. Lógica para Novo Cliente
      
      // 2.1 Garantir existência da categoria 'Cardápio Digital'
      const category = await tx.customerCategory.upsert({
        where: { name_companyId: { name: "Cardápio Digital", companyId } },
        update: {},
        create: { name: "Cardápio Digital", companyId },
      });

      // 2.2 Garantir existência da etapa 'Cardápio Digital' no CRM
      let stage = await tx.cRMStage.findUnique({
        where: { name_companyId: { name: "Cardápio Digital", companyId } },
      });

      if (!stage) {
        // Move todas as outras etapas para frente para garantir que esta seja a primeira (order: 0)
        await tx.cRMStage.updateMany({
          where: { companyId },
          data: { order: { increment: 1 } },
        });

        stage = await tx.cRMStage.create({
          data: {
            name: "Cardápio Digital",
            order: 0,
            companyId,
          },
        });
      }

      // 2.3 Incrementar a posição de todos os clientes que já estão nesta etapa
      // Para garantir que o novo entre no topo (position: 0)
      await tx.customer.updateMany({
        where: { companyId, stageId: stage.id },
        data: { position: { increment: 1 } },
      });

      // 2.4 Criar o cliente vinculado à etapa e categoria
      return await tx.customer.create({
        data: {
          name,
          phone: phoneNumber,
          email: email || undefined,
          birthday: birthDate ? new Date(birthDate) : undefined,
          imageUrl: imageUrl || undefined,
          companyId,
          source: "MENU",
          isActive: true,
          position: 0,
          stageId: stage.id,
          categories: {
            connect: { id: category.id },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      customer: {
        customerId: customer.id,
        name: customer.name,
        phoneNumber: customer.phone,
        imageUrl: customer.imageUrl,
      },
    });
  } catch (error: any) {
    console.error("Erro ao registrar cliente:", error);
    
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
