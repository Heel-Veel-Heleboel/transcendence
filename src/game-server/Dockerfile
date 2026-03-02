FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig*.json ./
COPY src ./src/
COPY public ./public/
RUN npm run build

EXPOSE 2567
CMD ["node", "./build/src/index.js"]
