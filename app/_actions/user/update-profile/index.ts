"use server";

import { auth } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
