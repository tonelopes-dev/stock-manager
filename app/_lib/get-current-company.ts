"use server";

import { auth } from "./auth";
import { db } from "./prisma";
import { redirect } from "next/navigation";

export async function getCurrentCompanyId(): Promise<string> {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login?reason=session_expired");
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
  const slug = (session.user.name || "user")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

  const company = await db.company.create({
    data: {
      name: `${session.user.name || "User"}'s Company`,
      slug: `${slug}-${Math.random().toString(36).substring(2, 7)}`,
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
