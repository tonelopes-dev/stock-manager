import "server-only";
import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const getChecklistTemplates = async () => {
  const companyId = await getCurrentCompanyId();
  return db.checklistTemplate.findMany({
    where: { companyId },
  });
};
