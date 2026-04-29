import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Bebidas", icon: "🥤" },
    { name: "Salgados", icon: "🍕" },
    { name: "Cafeteria", icon: "☕" },
    { name: "Sobremesas", icon: "🍨" },
    { name: "Insumos", icon: "📦" },
    { name: "Combos", icon: "🍔" },
  ];

  console.log("Updating category icons...");

  for (const cat of categories) {
    await prisma.category.updateMany({
      where: { name: cat.name },
      data: { icon: cat.icon },
    });
    console.log(`Updated ${cat.name} to ${cat.icon}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
