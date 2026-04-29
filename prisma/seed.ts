import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./seeds/seed-users";
import { seedProducts } from "./seeds/seed-products";
import { seedCustomers } from "./seeds/seed-customers";
import { seedOrders } from "./seeds/seed-orders";
import { seedFinances } from "./seeds/seed-finances";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Modular Seeding Process (atemporal & dynamic)...");
  
  try {
    // 1. Users & Company (Base for everything)
    const { company, users } = await seedUsers(prisma);

    // 2. Customers & CRM Stages (Required for sales and journey)
    const { customers } = await seedCustomers(prisma, company.id);

    // 3. Products & Categories (The core catalog)
    const { products } = await seedProducts(prisma, company.id);

    // 4. Sales History & Operations (Generates the 60-day atemporal data)
    await seedOrders(prisma, company.id, users, products, customers);

    // 5. Finances (Suppliers & Fixed Expenses)
    await seedFinances(prisma, company.id);

    console.log("✅ Modular Seeding Completed Successfully.");
    console.log("   🚀 Company: Rota 360");
    console.log("   🍳 Environment: Professional SDET Ready");
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
