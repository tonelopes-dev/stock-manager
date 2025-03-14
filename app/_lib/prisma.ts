import { PrismaClient, Product as PrismaProduct } from "@prisma/client";

declare global {
  var cachedPrisma: ReturnType<typeof createPrismaClient>;
}

type Product = PrismaProduct & {
  status: "in-stock" | "out-of-stock";
};

const createPrismaClient = () => {
  return new PrismaClient().$extends({
    result: {
      product: {
        status: {
          needs: {
            stock: true,
          },
          compute(product) {
            if (product.stock === 0) {
              return "out-of-stock";
            }
            return "in-stock";
          },
        },
      },
    },
  });
};

let prisma: ReturnType<typeof createPrismaClient>;
if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = createPrismaClient();
  }
  prisma = global.cachedPrisma;
}

export const db = prisma;
export type { Product };
