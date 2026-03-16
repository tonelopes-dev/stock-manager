# Guia Rápido: Alternância de Banco de Dados

Siga estas instruções para alternar o banco de dados da aplicação rodando localmente (`npm run dev`).

---

## 1. App Local + DB Local (Docker)

Use este cenário para desenvolvimento offline ou testes locais rápidos.

1.  **Subir o Banco no Docker:**
    ```bash
    docker compose up stocky-db -d
    ```
2.  **Configurar `.env`:**
    No arquivo `.env`, comente as URLs da Nuvem e descomente as do Local:
    ```env
    # DATABASE_URL="...neon.tech..." (COMENTAR)
    DATABASE_URL="postgresql://user:password@localhost:5432/stocky" (DESCOMENTAR)
    ```
3.  **Rodar a aplicação:**
    ```bash
    npm run dev
    ```

---

## 2. App Local + DB Nuvem (Neon)

Use este cenário para trabalhar com os dados reais/sincronizados da nuvem.

1.  **Configurar `.env`:**
    No arquivo `.env`, descomente as URLs da Nuvem e comente as do Local:
    ```env
    DATABASE_URL="postgresql://...neon.tech..." (DESCOMENTAR)
    # DATABASE_URL="...localhost:5432..." (COMENTAR)
    ```
2.  **Rodar a aplicação:**
    ```bash
    npm run dev
    ```

---

## Observações Importantes

- **Migrations (IMPORTANTE):** O comando `migrate deploy` apenas aplica arquivos SQL que já existem na pasta `prisma/migrations`. Ele **não** detecta mudanças no arquivo `schema.prisma`.
  
  **Fluxo Correto para Mudanças de Esquema:**
  1. No banco local (Docker), rode: `npx prisma migrate dev --name nome_da_mudanca`
  2. Isso criará o arquivo SQL necessário na pasta `migrations`.
  3. No banco da Nuvem (Neon), rode: `npx prisma migrate deploy`
  
  > [!WARNING]
  > Se você usar `npx prisma db push` para testar, as mudanças não se tornarão migrações e o `migrate deploy` na nuvem não funcionará.
- **Parar o Docker:** Se não estiver usando o banco local, você pode pará-lo para economizar recursos:
  ```bash
  docker compose stop stocky-db
  ```
