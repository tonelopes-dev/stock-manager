const { execSync } = require('child_process');
const fs = require('fs');

try {
  // 1. Identifica a branch atual do seu Git local
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  
  // 2. Seu Project ID extraído da URL que você mandou
  const projectId = 'hidden-darkness-37808537'; 

  console.log(`📡 Sincronizando com a branch do Neon: preview/${branch}...`);

  // 3. Busca a connection string diretamente via Neon CLI
  // Usamos a branch de preview que a Vercel cria automaticamente no push
  const cmd = `neonctl connection-string preview/${branch} --project-id ${projectId}`;
  const connectionString = execSync(cmd).toString().trim();

  // 4. Salva no seu arquivo local .env.local
  // Usamos .env.local pois ele tem prioridade no Next.js e não vai para o Git
  fs.writeFileSync('.env.local', `DATABASE_URL="${connectionString}"\n`);
  
  console.log('✅ Tudo pronto! Seu .env.local agora aponta para o banco de teste.');
} catch (error) {
  console.error('❌ Erro: Certifique-se de que você já deu "git push" para essa branch.');
  console.error('O Neon só cria a branch de banco após o primeiro deploy de preview na Vercel.');
}