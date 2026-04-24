import { PrismaClient, UserRole, SubscriptionStatus } from "@prisma/client";
import { hash } from "bcryptjs";

export async function seedUsers(prisma: PrismaClient) {
  console.log("🏢 Seeding company and users...");
  const hashedPassword = await hash("senha123", 10);

  const company = await prisma.company.upsert({
    where: { id: "rota-360-id" },
    update: {
      name: "Rota 360",
      slug: "rota-360",
      plan: "PRO",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      expiresAt: new Date(new Date().setDate(new Date().getDate() + 90)),
    },
    create: {
      id: "rota-360-id",
      name: "Rota 360",
      slug: "rota-360",
      plan: "PRO",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      expiresAt: new Date(new Date().setDate(new Date().getDate() + 90)),
    },
  });

  const userData = [
    { name: "Matheus", email: "matheus@rota360.com", role: UserRole.OWNER },
    { name: "Everton", email: "everton@rota360.com", role: UserRole.ADMIN },
    { name: "Atendente", email: "atendente@rota360.com", role: UserRole.MEMBER },
  ];

  const users: Record<string, any> = {};
  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
      },
    });

    await prisma.userCompany.upsert({
      where: { userId_companyId: { userId: user.id, companyId: company.id } },
      update: { role: u.role },
      create: {
        userId: user.id,
        companyId: company.id,
        role: u.role,
      },
    });
    users[u.name] = user;
  }

  return { company, users };
}
