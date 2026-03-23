FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY keys ./keys/
COPY config ./config/
RUN npm install
COPY src ./src/
RUN npm run build
COPY .env* ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
CMD ["node", "--env-file-if-exists=.env", "dist/index.js"]
