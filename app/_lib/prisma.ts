import { PrismaClient } from "@prisma/client";

declare global {
  var cachedPrisma: ReturnType<typeof createPrismaCliente>;
}

const createPrismaCliente = () => {
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

let prisma: ReturnType<typeof createPrismaCliente>;
if (process.env.NODE_ENV === "production") {
  prisma = createPrismaCliente();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = createPrismaCliente();
  }
  prisma = global.cachedPrisma;
}

export const db = prisma;
