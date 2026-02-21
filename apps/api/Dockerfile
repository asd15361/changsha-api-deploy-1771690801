FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json apps/api/

RUN npm ci

COPY apps/api apps/api

WORKDIR /app/apps/api

RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL=file:./prisma/dev.db

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node dist/src/main.js"]
