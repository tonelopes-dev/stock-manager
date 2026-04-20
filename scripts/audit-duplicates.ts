import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

/**
 * 🕵️‍♂️ Script de Auditoria Controlada
 * 
 * Objetivo: Identificar duplicatas de (name + companyId) com normalização:
 * - Lowercase (Case-Insensitive)
 * - Trim (Espaços em branco)
 */

const prisma = new PrismaClient();

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  🕵️‍♂️ AUDITORIA: Duplicatas (Case-Insensitive + Trim)     ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("\n🔍 Analisando banco de dados...");

  // 1. Identificar grupos duplicados via SQL com normalização
  const duplicateGroups: any[] = await prisma.$queryRaw`
    SELECT LOWER(TRIM(name)) as normalized_name, "companyId", COUNT(*)::int AS count
    FROM "Product"
    GROUP BY LOWER(TRIM(name)), "companyId"
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `;

  if (duplicateGroups.length === 0) {
    console.log("✅ Nenhuma duplicata encontrada com os critérios de normalização.");
    if (fs.existsSync("audit-report.json")) fs.unlinkSync("audit-report.json");
    fs.writeFileSync("audit-report.json", JSON.stringify([], null, 2));
    return;
  }

  const report = [];

  for (const group of duplicateGroups) {
    const { normalized_name, companyId } = group;

    // 2. Buscar detalhes de todos os registros do grupo
    // Usamos SQL para garantir que a busca bate exatamente com a normalização do GROUP BY
    const records: any[] = await prisma.$queryRaw`
      SELECT id, name, "isActive", "createdAt", type
      FROM "Product"
      WHERE LOWER(TRIM(name)) = ${normalized_name}
        AND "companyId" = ${companyId}
      ORDER BY "isActive" DESC, "createdAt" ASC
    `;

    // 3. Aplicar Critério de Senioridade (Vencedor: Ativo > Mais Antigo)
    // A query já traz ordenado: isActive DESC (True primeiro), createdAt ASC (Oldest primeiro)
    const [winner, ...duplicates] = records;

    report.push({
      groupInfo: {
        normalizedName: normalized_name,
        companyId,
        totalRecords: records.length
      },
      winner: {
        id: winner.id,
        currentName: winner.name,
        type: winner.type,
        isActive: winner.isActive,
        createdAt: winner.createdAt,
        action: "KEEP_ORIGINAL_NAME"
      },
      duplicates: duplicates.map(d => ({
        id: d.id,
        currentName: d.name,
        type: d.type,
        isActive: d.isActive,
        createdAt: d.createdAt,
        suggestedName: `${d.name} (Arquivado - ${d.id.slice(0, 8)})`,
        action: "RENAME"
      }))
    });
  }

  // 4. Salvar Relatório
  fs.writeFileSync("audit-report.json", JSON.stringify(report, null, 2));
  
  console.log("\n📊 RESULTADOS DA AUDITORIA:");
  console.log(`   - Grupos Duplicados: ${report.length}`);
  const totalDups = report.reduce((acc, curr) => acc + curr.duplicates.length, 0);
  console.log(`   - Total de registros para renomear: ${totalDups}`);
  console.log("\n📁 Relatório gerado em: audit-report.json");
  console.log("💡 Verifique o arquivo JSON antes de prosseguir com a migração.");
}

main()
  .catch((err) => {
    console.error("\n❌ Erro durante a auditoria:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
