import "server-only";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";

export const getTotalProducts = async (): Promise<number> => {
  const companyId = await getCurrentCompanyId();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return db.product.count({ where: { companyId } });
};
