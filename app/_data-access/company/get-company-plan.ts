import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";

export const getCompanyPlan = async () => {
  const companyId = await getCurrentCompanyId();

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      expiresAt: true,
      subscriptionStatus: true,
      isBoletoPending: true,
    },

  });

  if (!company) {
    throw new Error("Company not found");
  }

  return company;
};
