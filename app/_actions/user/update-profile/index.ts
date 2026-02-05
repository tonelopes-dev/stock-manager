"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";

const updateProfileSchema = z.object({
  name: z.string().min(3),
  phone: z.string().optional(),
});

export const updateProfile = actionClient
  .schema(updateProfileSchema)
  .action(async ({ parsedInput: { name, phone } }) => {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { name, phone },
    });

    revalidatePath("/profile");
    return { success: true };
  });
