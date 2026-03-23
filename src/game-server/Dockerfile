FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig*.json ./
COPY src ./src/
COPY public ./public/
RUN npm run build
COPY .env* ./

EXPOSE 2567
CMD ["node", "--env-file-if-exists=.env", "./build/src/index.js"]
