import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface ProductCategoryOption {
  id: string;
  name: string;
}

export const getProductCategories = async (environmentId?: string): Promise<ProductCategoryOption[]> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return [];

  const where: any = { companyId };
  
  // If environmentId is provided and not "all", only return categories that have products in that environment
  if (environmentId && environmentId !== "all") {
    where.products = {
      some: {
        environmentId
      }
    };
  }

  return db.category.findMany({
    where,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};
