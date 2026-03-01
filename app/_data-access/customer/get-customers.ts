import "server-only";

import { db } from "@/app/_lib/prisma";
import { CustomerCategory, Prisma } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface CustomerDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: CustomerCategory;
  source: string;
  birthday: Date | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    sales: number;
  };
}

export const getCustomers = async (
  category?: CustomerCategory | "ALL",
  search?: string,
): Promise<CustomerDto[]> => {
  const companyId = await getCurrentCompanyId();

  const where: Prisma.CustomerWhereInput = {
    companyId,
    ...(category && category !== "ALL" ? { category } : {}),
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    include: {
      _count: {
        select: {
          sales: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    category: customer.category,
    source: customer.source,
    birthday: customer.birthday,
    notes: customer.notes,
    isActive: customer.isActive,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    _count: customer._count,
  }));
};
