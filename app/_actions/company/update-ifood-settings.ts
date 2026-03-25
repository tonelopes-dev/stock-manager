"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ifoodSettingsSchema = z.object({
  ifoodMerchantId: z.string().optional().nullable(),
  ifoodClientId: z.string().optional().nullable(),
  ifoodClientSecret: z.string().optional().nullable(),
  ifoodOrdersEnabled: z.boolean().default(false),
  ifoodAutoConfirm: z.boolean().default(true),
});

export const updateIfoodSettingsAction = async (data: z.infer<typeof ifoodSettingsSchema>) => {
  try {
    const companyId = await getCurrentCompanyId();
    if (!companyId) throw new Error("Empresa não encontrada.");

    const validatedData = ifoodSettingsSchema.parse(data);

    await db.company.update({
      where: { id: companyId },
      data: validatedData,
    });

    revalidatePath("/(protected)/settings/integrations");
    revalidatePath("/(protected)/products");
    
    return { success: true, message: "Configurações do iFood atualizadas com sucesso!" };
  } catch (error) {
    console.error("[Action] Erro ao atualizar iFood settings:", error);
    return { success: false, message: "Falha ao salvar configurações." };
  }
};
