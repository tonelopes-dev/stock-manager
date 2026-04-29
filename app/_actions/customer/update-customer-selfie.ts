"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { deleteOldImage } from "@/app/_lib/storage";

export const updateCustomerSelfie = async (customerId: string, imageUrl: string) => {
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
