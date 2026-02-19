"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";
import { revalidatePath } from "next/cache";

export async function updateOnboarding(data: {
  onboardingStep?: number;
  businessType?: string;
}) {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error("Unauthorized");
  }

  await db.company.update({
    where: { id: session.user.companyId },
    data: {
      onboardingStep: data.onboardingStep,
      businessType: data.businessType,
      onboardingCompletedAt: data.onboardingStep === 1 ? new Date() : undefined,
    },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
}
