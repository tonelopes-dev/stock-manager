"use server";

import { db } from "@/app/_lib/prisma";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { deleteOldImage } from "@/app/_lib/storage";

export const updateCustomerSelfie = async (customerId: string, imageUrl: string) => {
  // Guard: apenas usuários com CUSTOMER_MANAGE podem atualizar a foto de clientes
  await assertActionCapability(PERMISSIONS.CUSTOMER_MANAGE);

  try {
    // Fetch current imageUrl for cleanup
    const currentCustomer = await db.customer.findUnique({
      where: { id: customerId },
      select: { imageUrl: true }
    });

    let oldImageUrl: string | null = null;
    if (currentCustomer?.imageUrl && currentCustomer.imageUrl !== imageUrl) {
      oldImageUrl = currentCustomer.imageUrl;
    }

    await db.customer.update({
      where: { id: customerId },
      data: { imageUrl },
    });
    
    if (oldImageUrl) {
      await deleteOldImage(oldImageUrl, imageUrl);
    }

    return { success: true };
  } catch (error) {
    console.error("[UPDATE_CUSTOMER_SELFIE_ERROR]", error);
    return { success: false, error: "Falha ao salvar selfie." };
  }
};
