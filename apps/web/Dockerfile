FROM node:20-alpine

RUN corepack enable

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/common/package.json ./packages/common/package.json

RUN pnpm install --frozen-lockfile --filter @sprintdock/web...

COPY apps/web ./apps/web
COPY packages/ui ./packages/ui
COPY packages/common ./packages/common

WORKDIR /workspace/apps/web
EXPOSE 5173
CMD ["pnpm", "dev"]
