import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";

export const getProductStockEntries = async (productId: string) => {
  const companyId = await getCurrentCompanyId();
  
  return await db.stockEntry.findMany({
    where: {
      productId,
      companyId,
    },
    include: {
      supplier: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
