import "server-only";

import { db } from "@/app/_lib/prisma";
import { CustomerCategory, Prisma } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { sanitizeUUID } from "@/app/_lib/uuid";

export interface CustomerDto {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  imageUrl: string | null;
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
  journey: "all" | "with" | "without" = "all",
): Promise<{ data: CustomerDto[]; total: number }> => {
  const companyId = await getCurrentCompanyId();
  const sanitizedCategoryId = sanitizeUUID(categoryId);

  const where: Prisma.CustomerWhereInput = {
    companyId,
    ...(sanitizedCategoryId
      ? { categories: { some: { id: sanitizedCategoryId } } }
      : {}),
    ...(journey === "with" ? { checklists: { some: {} } } : {}),
    ...(journey === "without" ? { checklists: { none: {} } } : {}),
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      {
        checklists: {
          some: {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              {
                items: {
                  some: { title: { contains: search, mode: "insensitive" } },
                },
              },
            ],
          },
        },
      },
    ];
  }

  // 1. Fetch customers and basic related data
  const [customers, total, salesAgg] = await Promise.all([
    db.customer.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        notes: true,
        imageUrl: true,
        stageId: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        email: true,
        phone: true,
        birthday: true,
        source: true,
        _count: {
          select: { sales: true },
        },
        categories: {
          select: { id: true, name: true, color: true },
        },
        stage: {
          select: { name: true },
        },
        checklists: {
          select: {
            id: true,
            title: true,
            items: {
              select: {
                id: true,
                title: true,
                isChecked: true,
                order: true,
                dueDate: true,
              },
              orderBy: { order: "asc" },
            },
          },
        },
        // Fetch only the latest sale date
        sales: {
          where: { status: "ACTIVE" },
          select: { date: true },
          orderBy: { date: "desc" },
          take: 1,
        },
      },
      orderBy: [
        { stage: { order: "asc" } },
        { position: "asc" },
        { createdAt: "desc" },
      ],
    }),
    db.customer.count({ where }),
    // 2. Fetch total spent per customer efficiently using groupBy
    db.sale.groupBy({
      by: ["customerId"],
      where: { 
        companyId, 
        status: "ACTIVE",
        customerId: { not: null }
      },
      _sum: { totalAmount: true },
    }),
  ]);

  // Create a map for quick access to total spent
  const totalSpentMap = new Map(
    salesAgg.map((s) => [s.customerId, Number(s._sum.totalAmount || 0)])
  );

  const data = customers.map((customer: any) => {
    const totalSpent = totalSpentMap.get(customer.id) || 0;
    const lastSaleDate = customer.sales?.[0]?.date || null;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email ?? null,
      phoneNumber: customer.phone ?? null,
      imageUrl: customer.imageUrl,
      categories: customer.categories,
      stageId: customer.stageId,
      stage: customer.stage,
      source: customer.source ?? "CRM",
      birthDate: customer.birthday ?? null,
      notes: customer.notes,
      isActive: customer.isActive,
      position: customer.position,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      _count: customer._count,
      totalSpent,
      lastSaleDate,
      sales: [], // We don't return all sales in the list anymore
      checklists: customer.checklists || [],
    };
  });

  return { data, total };
};

export const getCustomersForCombobox = async (): Promise<{ id: string; name: string; phone: string | null; imageUrl: string | null }[]> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return [];

  return db.customer.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      phone: true,
      imageUrl: true,
    },
    orderBy: { name: "asc" },
  });
};
