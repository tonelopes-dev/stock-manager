# 🚨 Diagnóstico de Migração: Unificação Products & Ingredients

**Data:** 2026-03-29  
**Autor:** DBA Review — Análise de Risco de Migração  
**Contexto:** A migração `20260329232941_unify_products_and_composition` foi gerada automaticamente pelo Prisma e aplicada com sucesso em **ambiente local (dev)** com reset total do banco. **Este arquivo documenta por que essa migração NÃO PODE ser aplicada em produção no formato atual e apresenta o plano de migração segura.**

---

## 1. Diagnóstico de Risco

### 1.1 O Que a Migração Destrutiva Faz

O arquivo `prisma/migrations/20260329232941_unify_products_and_composition/migration.sql` executa as seguintes operações:

| #   | Operação SQL                                                                                                        | Risco                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `ALTER TYPE "ProductType"` — Substitui o enum `RESELL`/`PREPARED` por `REVENDA`/`PRODUCAO_PROPRIA`/`COMBO`/`INSUMO` | 🔴 **CRÍTICO** — O cast `"type"::text::"ProductType_new"` falha se existirem linhas com `RESELL` ou `PREPARED` no banco, pois não há mapeamento de valores antigos para novos. |
| 2   | `ALTER TABLE "StockMovement" DROP COLUMN "ingredientId"`                                                            | 🔴 **CRÍTICO** — Perda permanente da rastreabilidade de movimentações históricas de insumos. Todas as rows com `ingredientId` preenchido perdem o vínculo.                     |
| 3   | `DROP TABLE "Ingredient"`                                                                                           | 🔴 **CRÍTICO** — Apaga todos os insumos cadastrados por todos os clientes. Dados irrecuperáveis.                                                                               |
| 4   | `DROP TABLE "ProductRecipe"`                                                                                        | 🔴 **CRÍTICO** — Apaga todas as fichas técnicas (receitas) cadastradas. Dados irrecuperáveis.                                                                                  |
| 5   | `ALTER TABLE "Product" ... stock INTEGER → DECIMAL(10,4)`                                                           | 🟡 **MÉDIO** — Mudança de tipo segura (widening), mas Prisma gera um warning enganoso sobre perda de dados. Na prática, `INTEGER → DECIMAL` não perde dados.                   |
| 6   | `CREATE TABLE "ProductComposition"`                                                                                 | 🟢 **SEGURO** — Criação de tabela nova, sem impacto em dados existentes.                                                                                                       |

### 1.2 Impacto em Produção (Se Aplicado Sem Alteração)

> [!CAUTION] > **Se executado em produção, este SQL causa PERDA DE DADOS IRREVERSÍVEL.**

1. **Clientes perdem todos os insumos** — Farinha, Carnes, Temperos, qualquer matéria-prima cadastrada.
2. **Clientes perdem todas as receitas** — Vínculo entre produto preparado e seus ingredientes.
3. **Histórico de estoque fica órfão** — `StockMovement` com `ingredientId` perde referência.
4. **Enum fail** — A conversão `RESELL → ???` falha em runtime. O Prisma não faz mapeamento automático de valores renomeados. **A migração falha na linha 16 e o banco fica em estado inconsistente** (dentro de uma transação parcialmente aplicada).

---

## 2. Estratégia de Migração Segura (Custom SQL)

### 2.1 Pré-Requisito: Reverter a Migração Destrutiva Localmente

A migração `20260329232941_unify_products_and_composition` já foi aplicada no banco de dev. Em produção, ela **nunca foi aplicada**. Para que o Prisma gere uma nova migração limpa, precisamos remover esta migração do histórico local:

```bash
# 1. Deletar a pasta da migração destrutiva
rm -rf prisma/migrations/20260329232941_unify_products_and_composition

# 2. Resetar o banco de dev para estado limpo (SÓ LOCALMENTE)
# Isso recria o banco do zero e aplica todas as migrações restantes
npx prisma migrate reset --force

# 3. Verificar que o banco local está no estado "pré-unificação"
npx prisma migrate status
```

> [!IMPORTANT]
> O `migrate reset` **apaga todo o banco de dev**. Isso é esperado e seguro — o seed repopulará os dados. **NUNCA execute `migrate reset` apontando para o banco de produção.**

### 2.2 Gerar a Migração Vazia (Create-Only)

Após o reset, o Prisma detectará que o schema atual (com `ProductComposition`, novos enum values, etc.) diverge do banco. Use `--create-only` para gerar o arquivo SQL sem executá-lo:

```bash
npx prisma migrate dev --name unify_products_safe --create-only
```

Isso cria o diretório `prisma/migrations/<timestamp>_unify_products_safe/migration.sql` com SQL gerado automaticamente. **Apague todo o conteúdo desse arquivo** e substitua pelo SQL customizado da Seção 2.3.

### 2.3 Script SQL de Migração Segura (PostgreSQL)

> [!IMPORTANT] > **Este é o SQL que deve ser colado dentro do arquivo `migration.sql` gerado pelo Prisma.** Ele executa a migração de dados **antes** de dropar as tabelas antigas. Todo o processo ocorre dentro de uma transação atômica.

```sql
-- ============================================================================
-- MIGRAÇÃO SEGURA: Unificação de Ingredient → Product + ProductComposition
-- Banco: PostgreSQL
-- Autor: DBA Review
-- Data: 2026-03-29
--
-- ORDEM DE OPERAÇÃO:
--   1. Expandir o enum ProductType (adicionar novos valores)
--   2. Migrar dados existentes (RESELL→REVENDA, PREPARED→PRODUCAO_PROPRIA)
--   3. Alterar colunas de Product (stock INT→DECIMAL)
--   4. Criar tabela ProductComposition
--   5. COPIAR dados de Ingredient → Product (como tipo INSUMO)
--   6. COPIAR dados de ProductRecipe → ProductComposition (remapeando IDs)
--   7. MIGRAR referências de StockMovement.ingredientId → productId
--   8. DROP da coluna ingredientId e das tabelas antigas
--   9. Limpar o enum antigo
-- ============================================================================

-- ============================================================
-- STEP 1: Expandir o enum ProductType com novos valores
-- ============================================================
-- Adicionamos os novos valores ao enum EXISTENTE primeiro.
-- Isso é seguro, pois ADD VALUE não afeta linhas existentes.
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'REVENDA';
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'PRODUCAO_PROPRIA';
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'COMBO';
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'INSUMO';

-- ============================================================
-- STEP 2: Migrar valores antigos do enum para os novos
-- ============================================================
-- Não podemos fazer UPDATE diretamente num enum Postgres sem um
-- truque. Usamos a técnica de criar tipo novo, converter, dropar antigo.
-- MAS primeiro precisamos que o Step 1 commite (ADD VALUE requer isso).
-- Então vamos converter via coluna TEXT intermediária.

-- 2a. Adicionar coluna temporária
ALTER TABLE "Product" ADD COLUMN "type_temp" TEXT;

-- 2b. Copiar e mapear valores
UPDATE "Product" SET "type_temp" = CASE
  WHEN "type"::text = 'RESELL' THEN 'REVENDA'
  WHEN "type"::text = 'PREPARED' THEN 'PRODUCAO_PROPRIA'
  ELSE "type"::text  -- Preservar se já for um novo valor (não deve acontecer em prod)
END;

-- 2c. Dropar o enum antigo e recriar com todos os valores
ALTER TABLE "Product" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "type" TYPE TEXT USING "type"::text;

-- Agora que a coluna não usa mais o enum, podemos recriá-lo
DROP TYPE "ProductType";
CREATE TYPE "ProductType" AS ENUM ('REVENDA', 'PRODUCAO_PROPRIA', 'COMBO', 'INSUMO');

-- 2d. Restaurar a coluna com o enum novo, usando os valores mapeados
ALTER TABLE "Product" ALTER COLUMN "type" TYPE "ProductType" USING "type_temp"::"ProductType";
ALTER TABLE "Product" ALTER COLUMN "type" SET DEFAULT 'REVENDA';

-- 2e. Limpar coluna temporária
ALTER TABLE "Product" DROP COLUMN "type_temp";

-- ============================================================
-- STEP 3: Alterar colunas do Product (INT → DECIMAL)
-- ============================================================
ALTER TABLE "Product"
  ALTER COLUMN "stock" SET DEFAULT 0,
  ALTER COLUMN "stock" SET DATA TYPE DECIMAL(10,4),
  ALTER COLUMN "minStock" SET DEFAULT 0,
  ALTER COLUMN "minStock" SET DATA TYPE DECIMAL(10,4);

-- ============================================================
-- STEP 4: Criar a nova tabela ProductComposition
-- ============================================================
CREATE TABLE "ProductComposition" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductComposition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductComposition_parentId_childId_key"
  ON "ProductComposition"("parentId", "childId");

ALTER TABLE "ProductComposition"
  ADD CONSTRAINT "ProductComposition_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductComposition"
  ADD CONSTRAINT "ProductComposition_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- STEP 5: COPIAR Ingredient → Product (como INSUMO)
-- ============================================================
-- Cada Ingredient vira um Product com:
--   - Mesmo ID (preserva referências em StockMovement.ingredientId)
--   - type = 'INSUMO'
--   - price = 0 (insumos não são vendidos diretamente)
--   - Mesmo unit, cost, stock, minStock, isActive, companyId
--   - SKU gerado a partir do nome
--
-- NOTA: Usamos o MESMO id do Ingredient como id do Product.
-- Isso permite migrar StockMovement.ingredientId → productId trivialmente.

INSERT INTO "Product" (
  "id",
  "name",
  "type",
  "price",
  "cost",
  "stock",
  "minStock",
  "unit",
  "isActive",
  "companyId",
  "createdAt",
  "updatedAt",
  "sku"
)
SELECT
  i."id",
  i."name",
  'INSUMO'::"ProductType",
  0,                                              -- Insumos não têm preço de venda
  i."cost",
  i."stock",
  i."minStock",
  i."unit",
  i."isActive",
  i."companyId",
  i."createdAt",
  i."updatedAt",
  CONCAT('insumo-', LOWER(REPLACE(i."name", ' ', '-')))  -- SKU derivado
FROM "Ingredient" i
-- Evitar colisão de ID caso o Ingredient.id já exista em Product (improvável, mas seguro)
WHERE NOT EXISTS (
  SELECT 1 FROM "Product" p WHERE p."id" = i."id"
);

-- Tratamento de colisão de SKU: Se o SKU gerado já existe para a mesma company,
-- adiciona um sufixo numérico
UPDATE "Product" p
SET "sku" = CONCAT(p."sku", '-', SUBSTRING(p."id", 1, 6))
WHERE p."type" = 'INSUMO'::"ProductType"
  AND EXISTS (
    SELECT 1 FROM "Product" p2
    WHERE p2."sku" = p."sku"
      AND p2."companyId" = p."companyId"
      AND p2."id" != p."id"
  );

-- ============================================================
-- STEP 6: COPIAR ProductRecipe → ProductComposition
-- ============================================================
-- ProductRecipe tinha: productId (pai/prepared), ingredientId (filho/insumo)
-- ProductComposition tem: parentId (pai), childId (filho)
--
-- Como usamos o MESMO id do Ingredient no Product (Step 5),
-- a conversão é direta: ingredientId → childId

INSERT INTO "ProductComposition" (
  "id",
  "parentId",
  "childId",
  "quantity",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,   -- Novo ID (cuid-like)
  pr."productId",            -- O produto pai (PREPARED)
  pr."ingredientId",         -- Agora é um Product do tipo INSUMO (mesmo ID)
  pr."quantity",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ProductRecipe" pr
-- Garantir integridade: só migrar se ambos os lados existem em Product
WHERE EXISTS (SELECT 1 FROM "Product" WHERE "id" = pr."productId")
  AND EXISTS (SELECT 1 FROM "Product" WHERE "id" = pr."ingredientId")
-- Evitar duplicatas
  AND NOT EXISTS (
    SELECT 1 FROM "ProductComposition" pc
    WHERE pc."parentId" = pr."productId" AND pc."childId" = pr."ingredientId"
  );

-- ============================================================
-- STEP 7: MIGRAR StockMovement.ingredientId → productId
-- ============================================================
-- Movimentações de estoque que apontavam para ingredientId agora
-- devem apontar para productId (mesmo UUID, pois mantivemos o id).
-- Onde productId JÁ tem valor e ingredientId TAMBÉM tem valor,
-- criamos uma entrada separada (não deveria acontecer, mas é seguro).

UPDATE "StockMovement"
SET "productId" = "ingredientId"
WHERE "ingredientId" IS NOT NULL
  AND "productId" IS NULL;

-- Para rows que têm AMBOS preenchidos (caso raro), preservar o
-- ingredientId em reason para auditoria
UPDATE "StockMovement"
SET "reason" = COALESCE("reason", '') || ' [migrated ingredientId: ' || "ingredientId" || ']'
WHERE "ingredientId" IS NOT NULL
  AND "productId" IS NOT NULL;

-- ============================================================
-- STEP 8: Limpar referências antigas
-- ============================================================

-- 8a. Dropar a FK e index de ingredientId em StockMovement
ALTER TABLE "StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_ingredientId_fkey";
DROP INDEX IF EXISTS "StockMovement_ingredientId_idx";

-- 8b. Dropar a coluna ingredientId
ALTER TABLE "StockMovement" DROP COLUMN "ingredientId";

-- 8c. Dropar as constraints da tabela ProductRecipe
ALTER TABLE "ProductRecipe" DROP CONSTRAINT IF EXISTS "ProductRecipe_ingredientId_fkey";
ALTER TABLE "ProductRecipe" DROP CONSTRAINT IF EXISTS "ProductRecipe_productId_fkey";

-- 8d. Dropar as constraints da tabela Ingredient
ALTER TABLE "Ingredient" DROP CONSTRAINT IF EXISTS "Ingredient_companyId_fkey";

-- 8e. Dropar as tabelas antigas (SOMENTE após a cópia dos dados)
DROP TABLE IF EXISTS "ProductRecipe";
DROP TABLE IF EXISTS "Ingredient";

-- ============================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO (queries de diagnóstico, não-destrutivas)
-- Descomente para executar manualmente e validar:
-- ============================================================

-- Contagem de insumos migrados:
-- SELECT COUNT(*) AS insumos_migrados FROM "Product" WHERE "type" = 'INSUMO';

-- Contagem de composições migradas:
-- SELECT COUNT(*) AS composicoes_migradas FROM "ProductComposition";

-- Movimentações de estoque sem orphans:
-- SELECT COUNT(*) AS orphan_movements
-- FROM "StockMovement" sm
-- WHERE sm."productId" IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM "Product" p WHERE p."id" = sm."productId");

-- Verificar se algum Product ficou com type antigo:
-- SELECT "type", COUNT(*) FROM "Product" GROUP BY "type";
```

---

## 3. Passo a Passo de Execução

### 3.1 Preparação (Ambiente Local)

```bash
# 1. Garantir que você está no branch correto
git checkout feature/unify-products

# 2. Remover a migração destrutiva gerada anteriormente
rm -rf prisma/migrations/20260329232941_unify_products_and_composition

# 3. Resetar o banco local para ficar no estado idêntico ao de produção
npx prisma migrate reset --force

# 4. Confirmar que todas as migrações anteriores foram aplicadas
npx prisma migrate status
# Deve mostrar: "Database schema is up to date!"
```

### 3.2 Gerar a Migração Customizada

```bash
# 5. O schema.prisma já está correto (com ProductComposition, novos enums, etc.)
#    Gerar o ARQUIVO de migração sem executar
npx prisma migrate dev --name unify_products_safe --create-only
```

Isso criará:

```
prisma/migrations/<timestamp>_unify_products_safe/migration.sql
```

### 3.3 Substituir o SQL

```bash
# 6. Abrir o arquivo gerado e APAGAR TODO o conteúdo
# 7. Colar o SQL da Seção 2.3 acima (o script customizado completo)
# 8. Salvar o arquivo
```

### 3.4 Testar Localmente

```bash
# 9. Aplicar a migração customizada no banco LOCAL
npx prisma migrate dev

# 10. Verificar integridade dos dados
npx prisma studio
# → Conferir que insumos aparecem em Product com type=INSUMO
# → Conferir que ProductComposition tem as receitas migradas
# → Conferir que StockMovement não tem orphans

# 11. Rodar a aplicação e testar as funcionalidades
npm run dev
```

### 3.5 Deploy em Produção

```bash
# 12. Fazer BACKUP do banco de produção antes de tudo
pg_dump -Fc $DATABASE_URL > backup_pre_migration_$(date +%Y%m%d).dump

# 13. Aplicar a migração em produção
npx prisma migrate deploy

# 14. Executar as queries de verificação do Step 9 do SQL
#     para confirmar que todos os dados foram migrados corretamente.
```

> [!WARNING] > **SEMPRE faça backup antes de executar `migrate deploy` em produção.**
> O `pg_dump` acima é o mínimo recomendável. Se estiver usando Supabase, Neon, ou serviço gerenciado, use o snapshot/backup nativo da plataforma.

---

## 4. Cenários de Rollback

### Se a migração falhar no meio:

O PostgreSQL executa migrações dentro de uma transação (DDL transacional). Se qualquer instrução falhar, **todo o bloco é revertido automaticamente** e o banco permanece no estado anterior.

### Se a migração for aplicada mas houver bug na aplicação:

1. O banco está num estado válido (dados preservados)
2. Reverta o deploy da aplicação para a versão anterior
3. Os dados antigos ainda existem na tabela `Product` com tipo `INSUMO`
4. A aplicação antiga não reconhecerá esses novos tipos, mas não quebrará dado que estão em tabelas/colunas existentes

### Se precisar reverter completamente o banco:

```bash
pg_restore -d $DATABASE_URL backup_pre_migration_YYYYMMDD.dump
npx prisma migrate resolve --rolled-back <timestamp>_unify_products_safe
```

---

## 5. Resumo Executivo

| Aspecto                | Migração Destrutiva (Original) | Migração Segura (Proposta)                 |
| ---------------------- | ------------------------------ | ------------------------------------------ |
| Dados de Ingredient    | ❌ DROP imediato               | ✅ INSERT INTO Product primeiro            |
| Dados de ProductRecipe | ❌ DROP imediato               | ✅ INSERT INTO ProductComposition primeiro |
| StockMovement history  | ❌ DROP COLUMN ingredientId    | ✅ UPDATE productId, depois DROP           |
| Enum conversion        | ❌ Cast direto que falha       | ✅ Coluna temp + mapeamento explícito      |
| Downtime estimado      | N/A (fatal)                    | ~30s-2min para bancos < 100k rows          |
| Rollback               | ❌ Impossível                  | ✅ pg_dump + transação DDL                 |

> [!CAUTION] > **NÃO execute `npx prisma migrate deploy` em produção até que:**
>
> 1. A migração destrutiva `20260329232941` tenha sido removida
> 2. A nova migração com SQL customizado tenha sido testada localmente
> 3. O backup do banco de produção tenha sido realizado
