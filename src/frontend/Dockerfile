# Build Stage
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD npm run prod
 
# # Production Stage
# FROM node:24-alpine  AS production
# COPY --from=build /app/dist .
# COPY --from=build /app/server.js ./server.js
# COPY --from=build /app/package.json ./package.json
# EXPOSE 5173
# RUN npm install
# RUN npm run prod
