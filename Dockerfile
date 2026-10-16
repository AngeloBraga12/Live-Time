# syntax=docker/dockerfile:1

# ---- build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# `npm install` (e não `ci`) porque o package-lock pode ainda não conter a f1-livetiming-api.
COPY package.json package-lock.json* .npmrc ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ---- runtime ----
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY --from=build --chown=node:node /app ./
USER node

# Só o site é público. A API escuta em 127.0.0.1:3001 dentro do container.
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# O supervisor inicia a API, reinicia se ela cair e sobe o Next.js.
CMD ["node", "scripts/run-site.mjs", "start"]
