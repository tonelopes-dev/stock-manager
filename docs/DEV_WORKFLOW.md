# Guia de Rotina de Desenvolvimento 🚀

Se você já se perguntou por que as coisas param de funcionar quando você muda de branch ou cria uma nova, este guia é para você.

## Por que o erro de "orderIndex" aconteceu?

Imagine que o **Prisma** é o arquiteto e o **Banco de Dados** é a obra pronta.

1.  O arquiteto (Prisma) atualizou a planta para incluir uma nova coluna chamada `orderIndex`.
2.  No seu código, o Prisma tentava salvar essa informação.
3.  Porém, a obra (Banco de Dados) ainda estava com a planta antiga e não tinha onde colocar esse dado. Isso gerava o erro.

**O complicador:** Você tinha dois arquivos de configuração: `.env` e `.env.local`.
-   Eu rodei a "obra" (migração) usando o endereço do `.env`.
-   Mas o seu site estava "morando" no endereço do `.env.local`.
-   Resultado: Eu atualizei uma obra, mas o site estava tentando usar outra que ainda estava desatualizada.

---

## Rotina para Novas Branches

Sempre que você criar uma funcionalidade nova ou mudar de branch, siga estes passos:

### 1. Sincronize o Banco de Dados (Neon)
Se o seu projeto usa o script de sincronização do Neon (que vimos no seu `package.json`), execute:
```bash
npm run db:sync
```
*Isso garante que o seu `.env.local` aponte para o banco de dados temporário daquela branch específica.*

### 2. Sincronize a "Planta" com a "Obra"
Mesmo apontando para o banco certo, ele pode estar com a estrutura antiga. Rode:
```bash
npx prisma migrate dev
```
*Isso vai ler as alterações no arquivo `schema.prisma` e aplicá-las no banco atual.*

### 3. Inicie o Desenvolvimento
Agora sim, pode rodar o projeto:
```bash
npm run dev
```

---

## Resumo em Resumo:
1.  **Mudou de branch?** ➜ `npm run db:sync`
2.  **Erro de banco/coluna?** ➜ `npx prisma migrate dev`
3.  **Dica de Ouro:** Mantenha o seu `.env` e `.env.local` sempre apontando para o mesmo lugar se estiver trabalhando em um banco fixo local, para evitar a confusão que tivemos hoje (onde um arquivo env "venceu" o outro)!
