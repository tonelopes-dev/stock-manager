import "server-only";

import { db } from "@/app/_lib/prisma";
import { CustomerCategory, Prisma } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface CustomerDto {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  categories: { id: string; name: string; color: string | null }[];
  stageId: string | null;
  stage: { name: string } | null;
  source: string;
  birthDate: Date | null;
  notes: string | null;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    sales: number;
  };
  totalSpent: number;
  lastSaleDate: Date | null;
  checklists: {
    id: string;
    title: string;
    items: {
      id: string;
      title: string;
      isChecked: boolean;
      order: number;
    }[];
  }[];
  sales: { 
    totalAmount: number; 
    date: Date;
    products: { name: string; quantity: number }[];
  }[];
}

export const getCustomers = async (
  categoryId?: string | "ALL",
  search?: string,
  page: number = 1,
  pageSize: number = 10,
  minimal: boolean = false,
): Promise<{ data: CustomerDto[]; total: number }> => {
  const companyId = await getCurrentCompanyId();

  const where: Prisma.CustomerWhereInput = {
    companyId,
    ...(categoryId && categoryId !== "ALL"
      ? { categories: { some: { id: categoryId } } }
      : {}),
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
        categories: {
          select: { id: true, name: true, color: true },
        },
        stage: {
          select: { name: true },
        },
        sales: {
          where: { status: "ACTIVE" },
          select: {
            totalAmount: true,
            date: true,
            ...(minimal
              ? {}
              : {
                  saleItems: {
                    select: {
                      quantity: true,
                      product: {
                        select: { name: true },
                      },
                    },
                  },
                }),
          },
          orderBy: { date: "desc" },
        },
        checklists: {
          include: {
            items: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
      orderBy: [
        { stage: { order: "asc" } },
        { position: "asc" },
        { createdAt: "desc" },
      ],
    }),
    db.customer.count({ where }),
  ]);


  const data = customers.map((customer: any) => {
    const totalSpent = customer.sales?.reduce(
      (acc: number, sale: any) => acc + Number(sale.totalAmount),
      0,
    ) || Number(customer.totalSpent ?? 0);

    const lastSaleDate =
      customer.sales && customer.sales.length > 0 ? (customer.sales[0] as any).date : null;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phone,
      categories: customer.categories,
      stageId: customer.stageId,
      stage: customer.stage,
      source: customer.source,
      birthDate: customer.birthday,
      notes: customer.notes,
      isActive: customer.isActive,
      position: customer.position,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      _count: customer._count,
      totalSpent,
      lastSaleDate,
      sales: customer.sales?.map((sale: any) => ({
        totalAmount: Number(sale.totalAmount),
        date: sale.date,
        products: sale.saleItems?.map((item: any) => ({
          name: item.product.name,
          quantity: Number(item.quantity),
        })) || [],
      })) || [],
      checklists: customer.checklists || [],
    };
  });



  return { data, total };
};
