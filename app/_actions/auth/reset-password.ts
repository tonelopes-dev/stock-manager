"use server";

import { db } from "@/app/_lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function resetPassword(token: string, password: string) {
  try {
    const validated = resetPasswordSchema.parse({ token, password });

    const user = await db.user.findFirst({
      where: {
        resetPasswordToken: validated.token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return { success: false, error: "Token inválido ou expirado." };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { success: false, error: "Falha ao redefinir senha." };
  }
}
