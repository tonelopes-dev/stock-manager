"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import bcrypt from "bcryptjs";

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export const changePassword = actionClient
  .schema(changePasswordSchema)
  .action(async ({ parsedInput: { currentPassword, newPassword } }) => {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      throw new Error("Usuário não encontrado ou não possui senha definida.");
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error("A senha atual está incorreta.");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id: session.user.id },
      data: { 
        password: hashedNewPassword,
        needsPasswordChange: false, // In case they were in some forced state
      },
    });

    return { success: true };
  });
