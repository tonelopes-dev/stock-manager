🚀 Guia de Sobrevivência: Deploy & Banco de Dados (Kipo)
Este documento serve como um guia rápido para diagnosticar e resolver os erros mais comuns durante o processo de CI/CD na Vercel e integrações com o NeonDB/Prisma.

🛠 1. Erros de Build (Vercel + Prisma)
Erro P1012: Environment variable not found: DIRECT_URL
Causa: O Prisma exige uma conexão direta (sem pooler) para rodar prisma migrate deploy em ambientes de produção ou preview.
Solução:

Acesse o painel da Vercel > Settings > Environment Variables.

Certifique-se de que a chave DIRECT_URL existe.

Dica de Ouro: Verifique se o escopo está definido para "All Preview Branches". Se estiver restrito apenas à branch develop, novas feature/branches falharão na build.

Erro P1002: Timed out trying to acquire a postgres advisory lock
Causa: Um processo de migration anterior travou ou caiu sem liberar o "cadeado" de segurança do banco de dados.
Solução:

Vá ao SQL Editor do NeonDB.

Execute o comando para derrubar conexões fantasmas:

SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'NOME_DO_SEU_BANCO' AND pid <> pg_backend_pid();
Realize um Redeploy na Vercel.

🗄 2. Erros de Runtime (Banco de Dados)
Erro: invalid input value for enum "ProductType": "VALOR"
Causa: Você adicionou um novo valor ao enum no arquivo schema.prisma, mas o Postgres ainda não conhece esse valor no tipo nativo.
Solução:

Execute a alteração manual via SQL no NeonDB:

SQL
ALTER TYPE "ProductType" ADD VALUE 'NOVO_VALOR';
Nota: Enums no Postgres não podem ser alterados dentro de transações de forma simples pelo Prisma em alguns cenários, por isso o ajuste manual é mais seguro.

🔐 3. Erros de Autenticação (NextAuth/Auth.js)
Erro: [auth][error] CredentialsSignin
Causa: Falha na validação de credenciais ou falta de variáveis de ambiente.
Solução:

Verifique se a AUTH_SECRET está configurada na Vercel.

Certifique-se de que o fluxo de login possui um try/catch para capturar erros de credenciais e retornar uma mensagem amigável, evitando o erro 500.

📝 4. Recomendações de Rotina (Checklist Pré-Deploy)
Para evitar surpresas no ambiente de produção, adote estes passos:

Sincronia Local: Antes de abrir um Pull Request, aponte seu .env local para o banco de desenvolvimento e rode:

npx prisma migrate dev --name sua_feature

Commit de Migrations: Nunca ignore a pasta prisma/migrations. Ela deve ser enviada ao repositório para que a Vercel saiba o que aplicar no banco de dados.

Ambientes de Preview: Sempre utilize as branches de Preview da Vercel para testar se a migration rodou com sucesso antes de fazer o merge para a main.

Snapshots Financeiros: Sempre que criar uma nova regra de custo (como o Custo Operacional), certifique-se de que a informação é salva no item da venda (SaleItem), garantindo que o histórico financeiro não mude se você alterar a taxa global no futuro.

📡 5. Configuração do Supabase Realtime
Se os pedidos não estiverem atualizando em tempo real no KDS ou no rastreador, é necessário configurar o banco de dados para suportar os filtros do Realtime.

Causa: Por padrão, o Postgres não envia os dados de todas as colunas em eventos de UPDATE, o que quebra os filtros do Supabase (ex: `companyId=eq.X`).
Solução:

Acesse o SQL Editor do Supabase.

Execute os comandos para habilitar a identidade de réplica completa e adicionar as tabelas à publicação:

SQL
-- Habilita o envio de todos os dados nos updates (Obrigatório para filtros)
ALTER TABLE "Order" REPLICA IDENTITY FULL;
ALTER TABLE "OrderItem" REPLICA IDENTITY FULL;

-- Garante que as tabelas estão na publicação de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE "Order";
ALTER PUBLICATION supabase_realtime ADD TABLE "OrderItem";
Nota: Se o comando de `ADD TABLE` der erro dizendo que a relação já existe, ignore; o passo mais importante é o `REPLICA IDENTITY FULL`.
