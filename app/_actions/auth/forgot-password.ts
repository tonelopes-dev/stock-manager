"use server";

import { db } from "@/app/_lib/prisma";
import { sendEmail } from "@/app/_services/email.service";
import { passwordResetTemplate } from "@/app/_services/email/templates";
import crypto from "crypto";

export async function forgotPassword(email: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if user exists
      return { success: true };
    }

    // Generate token and expiry (1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Redefinição de Senha - Stockly",
      html: passwordResetTemplate({
        name: user.name || "usuário",
        resetLink,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return { success: false, error: "Falha ao processar solicitação." };
  }
}
