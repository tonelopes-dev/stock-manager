import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hash("senha123", 10);
  const emails = ["matheus@rota360.com", "everton@rota360.com", "atendente@rota360.com"];

  console.log("🔐 Resetando senhas para 'senha123'...");

  for (const email of emails) {
    try {
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log(`✅ Senha atualizada: ${email}`);
    } catch (e) {
      console.log(`❌ Usuário não encontrado: ${email}`);
    }
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
