import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";

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
          avatarUrl: true,
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
    avatarUrl: member.user.avatarUrl,
    role: member.role,
    permissions: member.permissions,
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
