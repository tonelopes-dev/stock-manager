import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { Goal, Product } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export interface GoalDto extends Goal {
  product: Pick<Product, "name"> | null;
  currentValue: number;
  progressPercentage: number;
}

export const getGoals = async (): Promise<GoalDto[]> => {
  const companyId = await getCurrentCompanyId();

  const goals = await db.goal.findMany({
    where: {
      companyId,
    },
    include: {
      product: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      const start = startOfDay(goal.startDate);
      const end = goal.endDate ? endOfDay(goal.endDate) : endOfDay(new Date());

      let currentValue = 0;

      if (goal.type === "GLOBAL") {
        const result = await db.sale.aggregate({
          where: {
            companyId,
            status: "ACTIVE",
            date: {
              gte: start,
              lte: end,
            },
          },
          _sum: {
            totalAmount: true,
          },
        });
        currentValue = Number(result._sum.totalAmount || 0);
      } else if (goal.type === "PRODUCT" && goal.productId) {
        const result = await db.saleItem.aggregate({
          where: {
            sale: {
              companyId,
              status: "ACTIVE",
              date: {
                gte: start,
                lte: end,
              },
            },
            productId: goal.productId,
          },
          _sum: {
            totalAmount: true,
          },
        });
        currentValue = Number(result._sum.totalAmount || 0);
      }

      const targetValue = Number(goal.targetValue);
      const progressPercentage = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

      return {
        ...goal,
        currentValue,
        progressPercentage: Math.min(progressPercentage, 100), // Cap at 100 for some UI cases, or don't? Let's leave it uncapped for now but maybe UI handles it.
      };
    })
  );

  return goalsWithProgress;
};
