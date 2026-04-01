"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface SearchResult {
  id: string;
  type: "customer" | "product" | "sale" | "order";
  title: string;
  subtitle: string;
  href: string;
}

export const globalSearch = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 2) return [];

  const companyId = await getCurrentCompanyId();
  if (!companyId) return [];

  const searchTerm = query.trim();

  const [customers, products, sales, activeOrders] = await Promise.all([
    db.customer.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, phone: true },
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
    db.order.findMany({
      where: {
        companyId,
        status: {
          in: ["PENDING", "PREPARING", "READY", "DELIVERED"],
        },
        OR: [
          { customer: { name: { contains: searchTerm, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
        customerId: true,
        customer: { select: { name: true } },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const currencyFormatter = Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const dateFormatter = Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  const results: SearchResult[] = [
    ...customers.map((c) => ({
      id: c.id,
      type: "customer" as const,
      title: c.name,
      subtitle: c.phone || "Sem telefone",
      href: `/customers?action=edit&id=${c.id}`,
    })),
    ...products.map((p) => ({
      id: p.id,
      type: "product" as const,
      title: p.name,
      subtitle: currencyFormatter.format(Number(p.price)),
      href: `/products?action=edit&id=${p.id}`,
    })),
    ...activeOrders.map((o) => ({
      id: o.id,
      type: "order" as const,
      title: `Comanda Aberta — ${o.customer?.name || "Cliente Avulso"}`,
      subtitle: `Consumo: ${currencyFormatter.format(Number(o.totalAmount))}`,
      href: `/sales?view=gestao&action=open-comanda&customerId=${o.customerId}`,
    })),
    ...sales.map((s) => ({
      id: s.id,
      type: "sale" as const,
      title: `Venda Finalizada — ${s.customer?.name || "Cliente Avulso"}`,
      subtitle: `${dateFormatter.format(s.date)} • ${currencyFormatter.format(Number(s.totalAmount))}`,
      href: `/sales?view=inteligencia&saleId=${s.id}`,
    })),
  ];

  return results;
};
