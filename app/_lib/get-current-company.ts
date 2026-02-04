"use server";

import { auth } from "./auth";
import { db } from "./prisma";

export async function getCurrentCompanyId(): Promise<string> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  // If companyId is in session, return it
  if (session.user.companyId) {
    return session.user.companyId;
  }

  // Otherwise, try to find or create company for user
  const userCompany = await db.userCompany.findFirst({
    where: { userId: session.user.id },
    select: { companyId: true },
  });

  if (userCompany) {
    return userCompany.companyId;
  }

  // Auto-create company for user if missing
  const company = await db.company.create({
    data: {
      name: `${session.user.name || "User"}'s Company`,
    },
  });

  await db.userCompany.create({
    data: {
      userId: session.user.id,
      companyId: company.id,
      role: "OWNER",
    },
  });

  return company.id;
}

