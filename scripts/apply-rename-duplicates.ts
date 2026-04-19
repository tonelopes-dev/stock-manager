import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

/**
 * 🚀 Script de Execução: Aplicar Renomeações de Duplicatas
 * 
 * Este script lê o arquivo 'audit-report.json' e aplica as renomeações
 * sugeridas para garantir que o UNIQUE constraint possa ser aplicado.
 */

const prisma = new PrismaClient();

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  🚀 EXCUÇÃO: Aplicando Renomeações de Duplicatas       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  if (!fs.existsSync("audit-report.json")) {
    console.error("\n❌ Erro: Arquivo 'audit-report.json' não encontrado.");
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync("audit-report.json", "utf8"));

  const allDuplicates = report.flatMap((group: any) => group.duplicates);

  if (allDuplicates.length === 0) {
    console.log("\n✅ Nenhuma duplicata para renomear no relatório.");
    return;
  }

  console.log(`\n🔄 Preparando para renomear ${allDuplicates.length} registros...`);

  // Executar todas as atualizações em uma única transação
  try {
    await prisma.$transaction(
      allDuplicates.map((dup: any) =>
        prisma.product.update({
          where: { id: dup.id },
          data: { name: dup.suggestedName },
        })
      )
    );

    console.log(`\n✅ SUCESSO: ${allDuplicates.length} registros foram renomeados.`);
    console.log("\n📝 Resumo da transação:");
    allDuplicates.forEach((dup: any) => {
      console.log(`   - [ID: ${dup.id.slice(0, 8)}] "${dup.currentName}" → "${dup.suggestedName}"`);
    });

    console.log("\n💡 Agora os dados estão prontos para a aplicação do UNIQUE constraint.");
  } catch (error) {
    console.error("\n❌ Erro durante a transação. Nenhuma alteração foi realizada.", error);
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("\n❌ Erro fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
