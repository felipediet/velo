FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
#RUN corepack enable && yarn install --frozen-lockfile
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM node:20-alpine AS runtime
WORKDIR /app

# Serve static files from the Vite build output.
RUN yarn global add serve
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5173/ > /dev/null || exit 1

CMD ["serve", "-s", "dist", "-l", "5173"]