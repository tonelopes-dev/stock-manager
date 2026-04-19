/**
 * 🧹 Script de Limpeza: Deduplicação de nomes de Product e Ingredient (INSUMO)
 *
 * Objetivo: Renomear duplicatas (name + companyId) para permitir um índice UNIQUE.
 *
 * Regras:
 *  1. Identifica registros que compartilham o mesmo `name` e `companyId`.
 *  2. Se houver ATIVO + INATIVOS: mantém o ATIVO intacto, renomeia os INATIVOS.
 *  3. Se houver múltiplos ATIVOS: mantém o mais recente, renomeia os demais.
 *  4. Formato da renomeação: "[NOME_ORIGINAL] (Arquivado - [ID_CURTO])"
 *  5. Executa tudo em uma transação — lista as alterações antes do commit.
 *
 * Uso: npx tsx scripts/deduplicate-names.ts [--dry-run]
 */

import { PrismaClient, ProductType } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

interface DuplicateGroup {
  name: string;
  companyId: string;
  count: number;
}

interface RenameAction {
  id: string;
  table: string;
  type: ProductType;
  isActive: boolean;
  oldName: string;
  newName: string;
}

/**
 * Busca grupos duplicados via raw SQL (name + companyId) filtrando por tipo.
 */
async function findDuplicateGroups(
  types: ProductType[]
): Promise<DuplicateGroup[]> {
  const typeLiterals = types.map((t) => `'${t}'`).join(", ");

  const groups: DuplicateGroup[] = await prisma.$queryRawUnsafe(`
    SELECT name, "companyId", COUNT(*)::int AS count
    FROM "Product"
    WHERE type IN (${typeLiterals})
    GROUP BY name, "companyId"
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `);

  return groups;
}

/**
 * Para cada grupo duplicado, define quais registros devem ser renomeados.
 */
async function buildRenameActions(
  groups: DuplicateGroup[],
  label: string
): Promise<RenameAction[]> {
  const actions: RenameAction[] = [];

  for (const group of groups) {
    const records = await prisma.product.findMany({
      where: { name: group.name, companyId: group.companyId },
      orderBy: [
        { isActive: "desc" }, // ativos primeiro
        { updatedAt: "desc" }, // mais recente primeiro
      ],
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // O primeiro registro é o "keeper" (ativo mais recente)
    const [keeper, ...duplicates] = records;

    for (const dup of duplicates) {
      const shortId = dup.id.slice(0, 8);
      const newName = `${dup.name} (Arquivado - ${shortId})`;

      actions.push({
        id: dup.id,
        table: label,
        type: dup.type,
        isActive: dup.isActive,
        oldName: dup.name,
        newName,
      });
    }
  }

  return actions;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  🧹 Deduplicação de Nomes — Product & Ingredient       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();

  if (DRY_RUN) {
    console.log("⚠️  Modo DRY-RUN ativado — nenhuma alteração será gravada.\n");
  }

  // ── 1. Produtos (REVENDA, PRODUCAO_PROPRIA, COMBO)
  const productTypes: ProductType[] = [
    "REVENDA",
    "PRODUCAO_PROPRIA",
    "COMBO",
  ];
  const productDups = await findDuplicateGroups(productTypes);
  console.log(`📦 Produtos: ${productDups.length} grupo(s) duplicado(s) encontrado(s).`);

  const productActions = await buildRenameActions(productDups, "Product");

  // ── 2. Insumos (INSUMO)
  const ingredientDups = await findDuplicateGroups(["INSUMO"]);
  console.log(`🧂 Insumos:  ${ingredientDups.length} grupo(s) duplicado(s) encontrado(s).`);

  const ingredientActions = await buildRenameActions(ingredientDups, "Ingredient (INSUMO)");

  // ── 3. Consolidar
  const allActions = [...productActions, ...ingredientActions];

  if (allActions.length === 0) {
    console.log("\n✅ Nenhuma duplicata encontrada. O banco já está limpo!");
    return;
  }

  // ── 4. Relatório
  console.log(`\n📝 ${allActions.length} renomeação(ões) planejada(s):\n`);
  console.log("┌──────────────────────────────────────────────────────────────────────────────────────────────────┐");
  console.log("│  Tabela               │ Ativo │ Nome Atual                        → Nome Novo                  │");
  console.log("├──────────────────────────────────────────────────────────────────────────────────────────────────┤");

  for (const a of allActions) {
    const activeLabel = a.isActive ? "  ✅  " : "  ❌  ";
    const tablePad = a.table.padEnd(20);
    console.log(
      `│ ${tablePad} │${activeLabel}│ "${a.oldName}"  →  "${a.newName}"`
    );
  }
  console.log("└──────────────────────────────────────────────────────────────────────────────────────────────────┘");

  if (DRY_RUN) {
    console.log("\n🛑 DRY-RUN: Nenhuma alteração foi aplicada.");
    return;
  }

  // ── 5. Executar em transação
  console.log("\n🔄 Aplicando renomeações em transação...");

  await prisma.$transaction(
    allActions.map((a) =>
      prisma.product.update({
        where: { id: a.id },
        data: { name: a.newName },
      })
    )
  );

  console.log(`\n✅ ${allActions.length} registro(s) renomeado(s) com sucesso!`);
  console.log("   Agora você pode aplicar o índice UNIQUE [name, companyId] com segurança.");
}

main()
  .catch((err) => {
    console.error("\n❌ Erro fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
