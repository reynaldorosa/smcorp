FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema (openssl para Prisma)
RUN apk add --no-cache openssl

# Copiar arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências (bcryptjs não requer compilação nativa)
RUN npm install

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Tornar entrypoint executável
RUN chmod +x entrypoint.sh

# Expor porta
EXPOSE 3001

# Comando padrão (sobrescrito pelo docker-compose)
CMD ["sh", "./entrypoint.sh"]
