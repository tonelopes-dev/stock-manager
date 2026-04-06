import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const getOverheadSettings = async () => {
  const companyId = await getCurrentCompanyId();

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      estimatedMonthlyVolume: true,
      enableOverheadInjection: true,
      fixedExpenses: {
        select: {
          value: true,
        },
      },
    },
  });

  if (!company) return null;

  const totalFixedExpenses = company.fixedExpenses.reduce(
    (acc, curr) => acc + Number(curr.value),
    0
  );
  const overheadRate =
    company.estimatedMonthlyVolume > 0
      ? totalFixedExpenses / company.estimatedMonthlyVolume
      : 0;

  return {
    enableOverheadInjection: company.enableOverheadInjection,
    overheadRate,
  };
};
