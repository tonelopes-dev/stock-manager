import { PrismaClient } from "@prisma/client";

export async function seedFinances(prisma: PrismaClient, companyId: string) {
  console.log("💰 Seeding suppliers and fixed expenses...");

  // 1. Suppliers
  const suppliersData = [
    { name: "Ambev S.A.", contactName: "Ricardo Santos", email: "contato@ambev.com.br", phone: "0800-725-0001", taxId: "07.526.557/0001-00" },
    { name: "Frigorífico Central", contactName: "João Carneiro", email: "vendas@frigorificocentral.com", phone: "11-4002-8922", taxId: "12.345.678/0001-99" },
    { name: "Distribuidora de Hortifruti", contactName: "Maria Silva", email: "maria@hortifruti.com", phone: "11-98888-7777", taxId: "98.765.432/0001-00" },
  ];

  for (const s of suppliersData) {
    await prisma.supplier.upsert({
      where: { name_companyId: { name: s.name, companyId } },
      update: { ...s },
      create: { ...s, companyId },
    });
  }

  // 2. Fixed Expenses
  const expensesData = [
    { name: "Aluguel", value: 4500.00 },
    { name: "Energia Elétrica", value: 1200.00 },
    { name: "Internet & Software", value: 350.00 },
    { name: "Salários (Equipe)", value: 8000.00 },
    { name: "Marketing Digital", value: 500.00 },
  ];

  for (const e of expensesData) {
    await prisma.fixedExpense.create({
      data: { ...e, companyId },
    });
  }

  return { success: true };
}
