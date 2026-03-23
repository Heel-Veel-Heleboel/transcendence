FROM node:24-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN npm install
COPY tsconfig.json ./
COPY src ./src/
RUN npm run db:generate
RUN npm run build

EXPOSE 3006
CMD ["sh", "-c", "npm run db:push && node dist/src/index.js"]
