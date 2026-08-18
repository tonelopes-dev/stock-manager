/**
 * Backfill Script — CRM RBAC Migration
 * ----------------------------------------
 * QUANDO RODAR: ANTES do deploy do novo código na Vercel.
 * PROPÓSITO: Adicionar customer:view e customer:manage para todos os ADMINs
 *            existentes, evitando que percam acesso ao CRM após o deploy.
 *
 * IDEMPOTENTE: seguro para rodar múltiplas vezes — o NOT (... = ANY(...))
 * impede que permissões sejam duplicadas no array do PostgreSQL.
 *
 * COMO RODAR:
 *   npx tsx scripts/backfill-crm-permissions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Iniciando backfill de permissões CRM para ADMINs...");

  // Adiciona customer:view para ADMINs que ainda não possuem
  const viewResult = await prisma.$executeRaw`
    UPDATE "UserCompany"
    SET permissions = array_cat(permissions, ARRAY['customer:view']::text[])
    WHERE role = 'ADMIN'
      AND NOT ('customer:view' = ANY(permissions))
  `;
  console.log(`✅ customer:view adicionado em ${viewResult} registro(s) de ADMIN`);

  // Adiciona customer:manage para ADMINs que ainda não possuem
  const manageResult = await prisma.$executeRaw`
    UPDATE "UserCompany"
    SET permissions = array_cat(permissions, ARRAY['customer:manage']::text[])
    WHERE role = 'ADMIN'
      AND NOT ('customer:manage' = ANY(permissions))
  `;
  console.log(`✅ customer:manage adicionado em ${manageResult} registro(s) de ADMIN`);

  // Relatório final: exibe o estado atual de todos os UserCompany após o backfill
  const admins = await prisma.userCompany.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      role: true,
      permissions: true,
      user: { select: { email: true } },
    },
  });

  console.log("\n📊 Estado final dos ADMINs após o backfill:");
  admins.forEach((uc) => {
    const hasView = uc.permissions.includes("customer:view");
    const hasManage = uc.permissions.includes("customer:manage");
    console.log(
      `  • ${uc.user.email} | customer:view=${hasView ? "✅" : "❌"} | customer:manage=${hasManage ? "✅" : "❌"}`
    );
  });

  console.log("\n🎉 Backfill concluído. Safe to deploy.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no backfill:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
