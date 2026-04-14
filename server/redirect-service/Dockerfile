FROM node:25-alpine3.22 AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY .npmrc ./
COPY src ./src
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile
RUN pnpm run build
RUN pnpm prune --prod

FROM node:25-alpine3.22 AS runner

WORKDIR /app
RUN apk add --no-cache curl
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY .npmrc ./
RUN npm install -g pm2
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

EXPOSE 4001

CMD ["npm", "run", "start"]
