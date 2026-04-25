"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";

export const updateCustomerSelfie = async (customerId: string, imageUrl: string) => {
  try {
    await db.customer.update({
      where: { id: customerId },
      data: { imageUrl },
    });
    
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_CUSTOMER_SELFIE_ERROR]", error);
    return { success: false, error: "Falha ao salvar selfie." };
  }
};
