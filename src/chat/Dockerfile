FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN npm install
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build
RUN npx prisma generate

EXPOSE 3006
CMD ["sh", "-c", "npx prisma db push --schema=./prisma/schema.prisma && node dist/index.js"]
