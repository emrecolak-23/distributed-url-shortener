FROM node:25-alpine3.22 AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

COPY src ./src
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile
RUN pnpm run build

FROM node:25-alpine3.22 AS runner

WORKDIR /app
RUN apk add --no-cache curl
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY .npmrc ./
RUN npm install -g pnpm pm2 && pnpm install --no-frozen-lockfile --prod
COPY --from=builder /app/build ./build

EXPOSE 4000

CMD ["npm", "run", "start"]
