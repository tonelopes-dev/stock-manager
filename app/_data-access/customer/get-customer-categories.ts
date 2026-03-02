import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const getCustomerCategories = async () => {
  const companyId = await getCurrentCompanyId();
  return db.customerCategory.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });
};
