import { db } from "@/app/_lib/prisma";

export const getSuppliers = async (companyId: string) => {
  return await db.supplier.findMany({
    where: {
      companyId,
    },
    orderBy: {
      name: "asc",
    },
  });
};
