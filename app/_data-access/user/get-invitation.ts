import { db } from "@/app/_lib/prisma";

export const getInvitation = async (id: string) => {
  return await db.companyInvitation.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          name: true,
        },
      },
    },
  });
};
