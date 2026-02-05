import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const getOnboardingStatus = async () => {
  try {
    const companyId = await getCurrentCompanyId();
    
    // Quick check: if company has products, onboarding is done
    const productCount = await db.product.count({
      where: { companyId },
    });

    return {
      needsOnboarding: productCount === 0,
    };
  } catch (error) {
    console.error("Erro ao carregar status do onboarding:", error);
    return { needsOnboarding: false };
  }
};
