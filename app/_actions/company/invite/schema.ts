import { UserRole } from "@prisma/client";
import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z.string().email({
    message: "Email inválido.",
  }),
  role: z.nativeEnum(UserRole).default(UserRole.MEMBER),
  permissions: z.array(z.string()).optional(),
});

export type InviteUserSchema = z.infer<typeof inviteUserSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().uuid(),
});

export type AcceptInvitationSchema = z.infer<typeof acceptInvitationSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type AcceptInviteSchema = z.infer<typeof acceptInviteSchema>;

export const rejectInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});

export type RejectInvitationSchema = z.infer<typeof rejectInvitationSchema>;
