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
RUN npm run prisma:generate

# Resto do Dockerfile (build do Next.js, exposição da porta, etc.)
# ...