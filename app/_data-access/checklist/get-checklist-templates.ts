import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import "server-only";

export const getChecklistTemplates = async () => {
  const companyId = await getCurrentCompanyId();
  return db.checklistTemplate.findMany({
    where: { companyId },
  });
};
