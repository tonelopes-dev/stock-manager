import { z } from "zod";
import { UserRole } from "@prisma/client";

export const inviteUserSchema = z.object({
  email: z.string().email({
    message: "Email inválido.",
  }),
  role: z.nativeEnum(UserRole).default(UserRole.MEMBER),
});

export type InviteUserSchema = z.infer<typeof inviteUserSchema>;

export const acceptInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});

export type AcceptInvitationSchema = z.infer<typeof acceptInvitationSchema>;

export const rejectInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});

export type RejectInvitationSchema = z.infer<typeof rejectInvitationSchema>;
