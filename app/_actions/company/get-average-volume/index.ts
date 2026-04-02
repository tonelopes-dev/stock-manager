"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { subDays } from "date-fns";
import { actionClient } from "@/app/_lib/safe-action";
import { SaleStatus } from "@prisma/client";

export const getAverageMonthlyVolume = actionClient
  .action(async () => {
    const companyId = await getCurrentCompanyId();
    const ninetyDaysAgo = subDays(new Date(), 90);

    const result = await db.saleItem.aggregate({
      where: {
        sale: {
          companyId,
          status: SaleStatus.ACTIVE,
          date: { gte: ninetyDaysAgo },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const totalQuantity = Number(result._sum.quantity || 0);
    
    // Average over the last 3 months
    return Math.round(totalQuantity / 3);
  });
