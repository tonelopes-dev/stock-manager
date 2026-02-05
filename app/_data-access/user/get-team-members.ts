import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const getTeamMembers = async () => {
  const companyId = await getCurrentCompanyId();

  const members = await db.userCompany.findMany({
    where: {
      companyId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return members.map((member) => ({
    id: member.id,
    userId: member.userId,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
    joinedAt: member.createdAt,
  }));
};

export const getPendingInvitations = async () => {
  const companyId = await getCurrentCompanyId();

  return await db.companyInvitation.findMany({
    where: {
      companyId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
