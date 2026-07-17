import "server-only";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";

export const getAccountsReceivable = async (): Promise<number> => {
  const companyId = await getCurrentCompanyId();
  const accountsReceivable = await db.$queryRaw<{ totalReceivable: number }[]>`
    SELECT SUM("SaleProduct"."unitPrice" * "SaleProduct"."quantity") as "totalReceivable"
    FROM "SaleProduct"
    JOIN "Sale" ON "SaleProduct"."saleId" = "Sale"."id"
    WHERE "Sale"."companyId" = ${companyId} AND "Sale"."status" = 'PENDING_PAYMENT';
  `;
  return Number(accountsReceivable[0]?.totalReceivable ?? 0);
};
