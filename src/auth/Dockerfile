FROM node:24-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN npm install
COPY tsconfig.json ./
COPY keys ./keys/
COPY src ./src/
RUN npm run build

EXPOSE 3003
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/src/index.js"]
