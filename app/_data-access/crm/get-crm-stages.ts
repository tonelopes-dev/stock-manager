import "server-only";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";

export const getCRMStages = async () => {
  const companyId = await getCurrentCompanyId();
  return db.cRMStage.findMany({
    where: { companyId },
    orderBy: { order: "asc" },
  });
};
