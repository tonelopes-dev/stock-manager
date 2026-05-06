
"use server";

import { revalidatePath } from "next/cache";
import { acceptInvitationSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { auth } from "@/app/_lib/auth";
import { InvitationService } from "@/app/_services/invitation.service";

/**
 * 🛡️ ACEITE DE CONVITE (Zero Trust)
 * Valida o token seguro e vincula o usuário à empresa com as capacidades granulares.
 */
export const acceptInvitation = actionClient
  .schema(acceptInvitationSchema)
  .action(async ({ parsedInput: { token } }) => {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Usuário não autenticado.");
    }

    // O serviço já valida token, expiração, status e cria o vínculo transacionalmente
    await InvitationService.acceptInvitation(token, userId);

    revalidatePath("/settings/team");
    revalidatePath("/");

    return { success: true };
  });

// Reject logic can stay or be moved to service if needed, 
// but for now let's focus on the acceptance flow which is the most critical.
