import { PrismaClient, UserRole, SaleStatus, StockMovementType, Plan } from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seeding...");

  const hashedPassword = await hash("senha123", 10);

  // 1. Create Company
  const company = await prisma.company.upsert({
    where: { id: "test-company-id" },
    update: {},
    create: {
      id: "test-company-id",
      name: "Empresa Stockly Teste",
      plan: Plan.PRO,
      maxProducts: 100,
      maxUsers: 10,
    },
  });

  // 2. Create Users
  const users = [
    { name: "Admin Teste", email: "admin@teste.com", role: UserRole.OWNER },
    { name: "Gerente Teste", email: "manager@teste.com", role: UserRole.ADMIN },
    { name: "Vendedor Teste", email: "seller@teste.com", role: UserRole.MEMBER },
  ];

  const createdUsers = [];
  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: { password: hashedPassword },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });

    await prisma.userCompany.upsert({
      where: {
        userId_companyId: {
          userId: createdUser.id,
          companyId: company.id,
        },
      },
      update: { role: user.role },
      create: {
        userId: createdUser.id,
        companyId: company.id,
        role: user.role,
      },
    });
    createdUsers.push(createdUser);
  }

  // 3. Create Products
  const productsData = [
    { name: "Coca-Cola 2L", price: 12.9, cost: 7.5, category: "Bebidas", stock: 50, minStock: 10 },
    { name: "Arroz Tio João 5kg", price: 29.9, cost: 22.0, category: "Alimentos", stock: 30, minStock: 5 },
    { name: "Feijão Camil 1kg", price: 8.5, cost: 5.2, category: "Alimentos", stock: 40, minStock: 8 },
    { name: "Detergente Ypê", price: 2.5, cost: 1.2, category: "Limpeza", stock: 100, minStock: 20 },
    { name: "Sabão em Pó Omo 2kg", price: 24.9, cost: 18.0, category: "Limpeza", stock: 15, minStock: 10 },
    { name: "Macarrão Barilla 500g", price: 7.9, cost: 4.5, category: "Alimentos", stock: 60, minStock: 15 },
    { name: "Azeite Gallo 500ml", price: 35.0, cost: 25.0, category: "Alimentos", stock: 12, minStock: 5 },
    { name: "Cerveja Heineken 330ml", price: 6.5, cost: 4.0, category: "Bebidas", stock: 120, minStock: 24 },
    { name: "Leite Ninho 400g", price: 18.9, cost: 14.0, category: "Alimentos", stock: 25, minStock: 10 },
    { name: "Papel Higiênico Neve 12un", price: 19.9, cost: 12.0, category: "Limpeza", stock: 20, minStock: 5 },
    { name: "Café Pilão 500g", price: 16.5, cost: 11.0, category: "Alimentos", stock: 35, minStock: 10 },
    { name: "Chocolate Milka 100g", price: 14.9, cost: 9.0, category: "Alimentos", stock: 45, minStock: 15 },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku: p.name.toLowerCase().replace(/ /g, "-"), companyId: company.id } },
      update: { stock: p.stock },
      create: {
        name: p.name,
        price: p.price,
        cost: p.cost,
        category: p.category,
        stock: p.stock,
        minStock: p.minStock,
        sku: p.name.toLowerCase().replace(/ /g, "-"),
        companyId: company.id,
      },
    });
    createdProducts.push(product);
  }

  // 4. Create Sales (Last 90 days)
  console.log("📊 Generating sales history...");
  for (let i = 0; i < 90; i++) {
    const date = subDays(new Date(), i);
    const salesCount = Math.floor(Math.random() * 10) + 3; // 3 to 12 sales per day

    for (let j = 0; j < salesCount; j++) {
      const productCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 products per sale

      // Random user/seller
      const seller = createdUsers[Math.floor(Math.random() * createdUsers.length)];

      const sale = await prisma.sale.create({
        data: {
          date: date,
          companyId: company.id,
          userId: seller.id,
          status: SaleStatus.ACTIVE,
        },
      });

      for (let k = 0; k < productCount; k++) {
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;

        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId: product.id,
            quantity: quantity,
            unitPrice: product.price,
            baseCost: product.cost,
          },
        });

        // Register stock movement
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            companyId: company.id,
            userId: seller.id,
            saleId: sale.id,
            type: StockMovementType.SALE,
            stockBefore: product.stock,
            stockAfter: product.stock - quantity,
          },
        });
      }
    }
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
