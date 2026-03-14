import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface ProductCategoryOption {
  id: string;
  name: string;
}

export const getProductCategories = async (): Promise<ProductCategoryOption[]> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return [];

  return db.category.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};
