FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json apps/api/

RUN npm install

COPY apps/api apps/api

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL=file:./dev.db

RUN npx prisma generate && npx prisma db push && npm run build

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
