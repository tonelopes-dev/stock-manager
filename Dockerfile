# Use uma imagem Node.js como base
FROM node:18-alpine

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos package.json e package-lock.json
COPY package.json package-lock.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código
COPY . .

# Gere o cliente do Prisma
RUN npx prisma generate

# Build da aplicação Next.js
RUN npm run build

# Expõe a porta 3000
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start"]