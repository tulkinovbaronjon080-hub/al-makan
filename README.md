# Al-Makan

Mobile-first SaaS "business operating system" for window & door manufacturers: customer → order → measurement → configuration → price calculation → BOM → production → warehouse → transfer → store/POS → payment → reporting.

Full architecture proposal, entity model, design system, navigation, risks, and phased roadmap: see the Phase 0 plan (kept in `.claude/plans/` locally) or ask the assistant to regenerate it from this doc.

## Stack

- **Web**: Next.js (App Router) + TypeScript + Tailwind + shared `@al-makan/ui` design system + TanStack Query, PWA-enabled
- **API**: NestJS + TypeScript, REST, Prisma
- **DB**: PostgreSQL via `@al-makan/database` (Prisma)
- **Infra**: Redis, S3-compatible storage (MinIO locally)

## Monorepo layout

```
apps/
  web/                 Next.js PWA
  api/                 NestJS REST API
packages/
  database/            Prisma schema + client
  types/                Shared Zod DTOs (used by both web and api)
  calculation-engine/  Pure pricing/BOM domain service — no framework deps
  ui/                   Shared design system (tokens + components)
  config/               Shared tsconfig/eslint
docker/
  docker-compose.yml   Postgres, Redis, MinIO for local dev
```

## Getting started

```bash
pnpm install

docker compose -f docker/docker-compose.yml up -d

cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
pnpm db:migrate

pnpm dev   # runs web (http://localhost:3000) + api (http://localhost:4000) in parallel via turbo
```

## Status

Phase 0 — architecture + design system + repo scaffold. No business logic, no auth, no real screens yet. See `apps/api/src/modules/README.md` for the module-by-module rollout and the roadmap for what lands in each phase.
