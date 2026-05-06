# Build Stage
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Vite replaces import.meta.env.VITE_* at build time.
# Pass HOST_IP when building for LAN/remote play:
#   VITE_API_URL=https://10.x.x.x VITE_GAME_URL=https://10.x.x.x/colyseus docker compose up --build
ARG VITE_API_URL=https://localhost:7140
ARG VITE_GAME_URL=https://localhost:7140/colyseus
ARG VITE_BODY_LIMIT_BYTES=1048576
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GAME_URL=$VITE_GAME_URL
ENV VITE_BODY_LIMIT_BYTES=$VITE_BODY_LIMIT_BYTES

RUN npm run build
CMD npm run prod
 
# TODO: think about whether to seperate stages
# # Production Stage
# FROM node:24-alpine  AS production
# COPY --from=build /app/dist .
# COPY --from=build /app/server.js ./server.js
# COPY --from=build /app/package.json ./package.json
# EXPOSE 5173
# RUN npm install
# RUN npm run prod
