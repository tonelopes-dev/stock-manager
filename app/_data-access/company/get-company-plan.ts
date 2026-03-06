import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const getCompanyPlan = async () => {
  const companyId = await getCurrentCompanyId();

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      subscriptionStatus: true,
      stripeInvoiceUrl: true,
      isBoletoPending: true,
    },

  });

  if (!company) {
    throw new Error("Company not found");
  }

  return company;
};
