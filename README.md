# Expense Tracker

Turborepo monorepo for the Expense Tracker SaaS (see `docs/implementation-plan.md`).

## Apps

| Path | Role |
|------|------|
| `apps/api` | NestJS backend |
| `apps/web` | Next.js dashboard / full desktop UI |
| `apps/capture` | Next.js PWA, mobile-first quick capture |

## Packages

| Path | Role |
|------|------|
| `packages/ui` | Shared React components + design tokens |
| `packages/types` | Shared Zod schemas / TypeScript types |
| `packages/config` | Shared ESLint / TS / Tailwind config |
| `packages/utils` | Shared pure utilities |

## Commands

```bash
npm install
npm run build   # turbo run build
npm run dev     # turbo run dev (all apps)
```

Planning docs live under `docs/`. Project conventions: `.cursor/rules/project.mdc`.
