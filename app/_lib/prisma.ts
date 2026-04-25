/* eslint-disable no-unused-vars */
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: ReturnType<typeof createPrismaClient>;
}

const createPrismaClient = () => {
  return new PrismaClient();
};

const prisma = global.cachedPrisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.cachedPrisma = prisma;
}

export const db = prisma;