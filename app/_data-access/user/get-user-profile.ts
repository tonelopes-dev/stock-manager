import { auth } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";

export const getUserProfile = async () => {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.companyId) {
    return null;
  }

  const userWithCompany = await db.userCompany.findUnique({
    where: {
      userId_companyId: {
        userId: session.user.id,
        companyId: session.user.companyId,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      company: {
        select: {
          plan: true,
        },
      },
    },
  });

  if (!userWithCompany) {
    return null;
  }

  return {
    name: userWithCompany.user.name,
    email: userWithCompany.user.email,
    role: userWithCompany.role,
    plan: userWithCompany.company.plan,
  };
};
