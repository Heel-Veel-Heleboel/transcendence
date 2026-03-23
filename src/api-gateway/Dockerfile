FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY keys ./keys/
RUN npm install
COPY src ./src/
RUN npm run build

EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
CMD ["node", "dist/index.js"]
