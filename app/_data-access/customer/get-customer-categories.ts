import "server-only";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";

export const getCustomerCategories = async () => {
  const companyId = await getCurrentCompanyId();
  return db.customerCategory.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });
};
