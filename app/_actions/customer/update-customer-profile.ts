"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";

interface UpdateCustomerProfileInput {
  customerId: string;
  name: string;
  email?: string;
  phoneNumber: string;
  birthDate?: string;
  companyId: string;
}

export const updateCustomerProfile = async (input: UpdateCustomerProfileInput) => {
  const { customerId, name, email, phoneNumber, birthDate, companyId } = input;

  try {
    // 1. Verify if the phone number is already taken by ANOTHER customer in the same company
    const existingByPhone = await db.customer.findFirst({
      where: {
        companyId,
        phone: phoneNumber,
        NOT: { id: customerId }
      }
    });

    if (existingByPhone) {
      return { success: false, message: "Este telefone já está sendo usado por outro cadastro." };
    }

    // 2. Update the customer
    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: {
        name,
        email: email || null,
        phone: phoneNumber,
        birthday: birthDate ? new Date(birthDate) : null,
      },
    });

    // 3. Return sanitized customer data
    return {
      success: true,
      customer: {
        customerId: updatedCustomer.id,
        name: updatedCustomer.name,
        phoneNumber: updatedCustomer.phone,
        email: updatedCustomer.email,
        birthDate: updatedCustomer.birthday,
        imageUrl: updatedCustomer.imageUrl,
      }
    };
  } catch (error) {
    console.error("[UPDATE_CUSTOMER_PROFILE_ERROR]", error);
    return { success: false, message: "Falha ao atualizar perfil." };
  }
};
