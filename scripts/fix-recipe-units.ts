import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting data fix for ProductRecipe.unit...");

  const recipes = await prisma.productRecipe.findMany({
    include: {
      ingredient: {
        select: { unit: true },
      },
    },
  });

  console.log(`🔍 Found ${recipes.length} recipes to update.`);

  for (const recipe of recipes) {
    await prisma.productRecipe.update({
      where: { id: recipe.id },
      data: {
        unit: recipe.ingredient.unit,
      },
    });
    console.log(`✅ Updated recipe ${recipe.id} with unit ${recipe.ingredient.unit}`);
  }

  console.log("✨ Data fix completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during data fix:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
