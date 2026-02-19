"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";
import { revalidatePath } from "next/cache";

export async function updateFirstAlertSeenAction() {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error("Unauthorized");
  }

  const company = await db.company.findUnique({
    where: { id: session.user.companyId },
    select: { firstAlertSeenAt: true }
  });

  if (!company?.firstAlertSeenAt) {
    await db.company.update({
      where: { id: session.user.companyId },
      data: { firstAlertSeenAt: new Date() },
    });
  }

  revalidatePath("/dashboard");
}
