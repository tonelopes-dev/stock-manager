import "server-only";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";

export const getTotalSales = async (): Promise<number> => {
  const companyId = await getCurrentCompanyId();
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return db.sale.count({ where: { companyId, status: "ACTIVE" } });
};
