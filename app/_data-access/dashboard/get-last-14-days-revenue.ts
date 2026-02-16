import { db } from "@/app/_lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import dayjs from "dayjs";
import "server-only";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface DayTotalRevenueDto {
  day: string;
  totalRevenue: number;
}

export const getLast14DaysRevenue = async (): Promise<DayTotalRevenueDto[]> => {
  const companyId = await getCurrentCompanyId();
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const today = dayjs().endOf("day").toDate();
  const last14Days = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(
    (day) => {
      return dayjs(today).subtract(day, "day");
    },
  );
  const totalLast14DaysRevenue: DayTotalRevenueDto[] = [];
  for (const day of last14Days) {
    const start = day.startOf("day").toDate();
    const end = day.endOf("day").toDate();
    
    const dayTotalRevenue = await db.$queryRaw<{ totalRevenue: Decimal }[]>`
      SELECT SUM("SaleProduct"."unitPrice" * "SaleProduct"."quantity") as "totalRevenue"
      FROM "SaleProduct"
      JOIN "Sale" ON "SaleProduct"."saleId" = "Sale"."id"
      WHERE "Sale"."date" >= ${start} AND "Sale"."date" <= ${end} AND "Sale"."companyId" = ${companyId};
    `;
    totalLast14DaysRevenue.push({
      day: day.format("DD/MM"),
      totalRevenue: Number(dayTotalRevenue[0]?.totalRevenue ?? 0),
    });
  }
  return totalLast14DaysRevenue;
};
