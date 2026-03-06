"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface SearchResult {
  id: string;
  type: "customer" | "product" | "sale";
  title: string;
  subtitle: string;
  href: string;
}

export const globalSearch = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 2) return [];

  const companyId = await getCurrentCompanyId();
  if (!companyId) return [];

  const searchTerm = query.trim();

  const [customers, products, sales] = await Promise.all([
    db.customer.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { phoneNumber: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, phoneNumber: true },
      take: 5,
    }),
    db.product.findMany({
      where: {
        companyId,
        name: { contains: searchTerm, mode: "insensitive" },
      },
      select: { id: true, name: true, price: true },
      take: 5,
    }),
    db.sale.findMany({
      where: {
        companyId,
        OR: [
          { customer: { name: { contains: searchTerm, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        totalAmount: true,
        date: true,
        customer: { select: { name: true } },
      },
      take: 5,
      orderBy: { date: "desc" },
    }),
  ]);

  const results: SearchResult[] = [
    ...customers.map((c) => ({
      id: c.id,
      type: "customer" as const,
      title: c.name,
      subtitle: c.phoneNumber || "Sem telefone",
      href: `/customers`,
    })),
    ...products.map((p) => ({
      id: p.id,
      type: "product" as const,
      title: p.name,
      subtitle: Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(p.price)),
      href: `/products/${p.id}`,
    })),
    ...sales.map((s) => ({
      id: s.id,
      type: "sale" as const,
      title: `Venda — ${s.customer?.name || "Cliente Avulso"}`,
      subtitle: Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(s.totalAmount)),
      href: `/sales`,
    })),
  ];

  return results;
};
