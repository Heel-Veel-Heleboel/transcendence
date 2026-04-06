FROM node:24-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
COPY .env ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN npm install
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build
COPY .env* ./

EXPOSE 3004
CMD ["sh", "-c", "npx prisma db push --schema=./prisma/schema.prisma && node --env-file-if-exists=.env dist/src/index.js"]
