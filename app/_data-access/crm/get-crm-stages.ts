import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const getCRMStages = async () => {
  const companyId = await getCurrentCompanyId();
  return db.cRMStage.findMany({
    where: { companyId },
    orderBy: { order: "asc" },
  });
};
