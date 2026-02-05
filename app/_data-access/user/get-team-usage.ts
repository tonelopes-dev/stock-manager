import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface TeamUsageDto {
  userCount: number;
  maxUsers: number;
}

export const getTeamUsage = async (): Promise<TeamUsageDto> => {
  const companyId = await getCurrentCompanyId();

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { maxUsers: true },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  const userCount = await db.userCompany.count({
    where: { companyId },
  });

  // Invitations also count towards the limit
  const pendingInvitations = await db.companyInvitation.count({
    where: { companyId, status: "PENDING" },
  });

  return {
    userCount: userCount + pendingInvitations,
    maxUsers: company.maxUsers,
  };
};
