import "server-only";
import { auth } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";

export const getUserSecurityStatus = async () => {
  const session = await auth();
  if (!session?.user?.id) return { needsPasswordChange: false };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { needsPasswordChange: true },
  });

  return {
    needsPasswordChange: !!user?.needsPasswordChange,
  };
};
