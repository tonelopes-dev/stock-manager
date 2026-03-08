#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem cor

echo -e "${YELLOW}🚀 Iniciando Diagnóstico de Pré-Deploy - Stockly${NC}"
echo "--------------------------------------------------------"

# 1. Verificação de Arquivos de Ambiente
if [ -f .env.local ]; then
    echo -e "${GREEN}✅ .env.local encontrado.${NC}"
else
    echo -e "${RED}❌ ERRO: .env.local não encontrado! Crie um antes de continuar.${NC}"
    exit 1
fi

# 2. Identificação do Banco Conectado
DB_HOST=$(grep "DATABASE_URL=" .env.local | cut -d'@' -f2 | cut -d'/' -f1)
echo -e "${YELLOW}📡 Conectado ao Host: ${DB_HOST}${NC}"

if [[ $DB_HOST == *"super-base"* ]]; then
    echo -e "${RED}⚠️ ATENÇÃO: Você está apontando para a MAIN (Produção)!${NC}"
else
    echo -e "${GREEN}🧪 Você está em uma branch de TESTE/PREVIEW.${NC}"
fi

# 3. Status do Prisma Migrate
echo -e "\n${YELLOW}🔍 Checando status das migrações...${NC}"
MIGRATE_STATUS=$(npx prisma migrate status 2>&1)

if [[ $MIGRATE_STATUS == *"Database schema is up to date"* ]]; then
    echo -e "${GREEN}✅ Sincronização Perfeita: Banco e Código estão iguais.${NC}"
else
    echo -e "${RED}❌ CONFLITO DETECTADO!${NC}"
    echo "$MIGRATE_STATUS"
    echo -e "\n${YELLOW}💡 Sugestão:${NC}"
    echo "   - Se o erro for P3018 (Já existe): use 'npx prisma migrate resolve --applied [nome]'."
    echo "   - Se o erro for P2021 (Tabela ausente): use 'npx prisma db push'."
    exit 1
fi

# 4. Verificação de Tabelas Críticas (Checklists e Orders)
echo -e "\n${YELLOW}📊 Validando estrutura física da Fase 2...${NC}"
npx prisma db pull --print > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Estrutura física validada com sucesso.${NC}"
else
    echo -e "${RED}❌ ERRO: O banco físico não bate com o schema.prisma! Rode 'npx prisma db push'.${NC}"
    exit 1
fi

echo "--------------------------------------------------------"
echo -e "${GREEN}🎉 TUDO PRONTO! Pode seguir com o Merge/Deploy com segurança.${NC}"