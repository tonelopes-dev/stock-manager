import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface EnvironmentOption {
  id: string;
  name: string;
}

export const getEnvironments = async (): Promise<EnvironmentOption[]> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return [];

  return db.environment.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};
