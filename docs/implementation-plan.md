# Implementation Plan — Expense Tracker SaaS
### Architecture, code structure, UI stack, design system, and database, phase by phase

*Companion to the SRS. This document answers "how is the code actually organized" — every module below is built as its own set of small, single-purpose files (entity / dto / service / controller / repository / module on the backend; component / hook / api-client / types on the frontend), never as one large file. That pattern is shown in full for one module on each side (Transactions) and then applied identically to every other module.*

---

## 1. Guiding principles for code structure

1. **One responsibility per file.** A controller file never contains business logic; a service file never contains HTTP concerns; a React component file never contains a raw `fetch` call. If a file is doing two of those jobs, split it.
2. **Feature-based, not type-based, top-level folders.** `transactions/` holds everything about transactions (backend and frontend, separately). You should never have to open five unrelated top-level folders to understand one feature.
3. **Shared code lives in `shared/` (backend) and `packages/ui` + `lib/` (frontend), and only moves there after it's used twice.** Don't pre-abstract; extract on the second real use.
4. **Every module is independently testable.** A service depends on a repository interface, not a concrete ORM call sprinkled through business logic — this is what makes the AI categorization service swappable/mockable later without touching callers.
5. **Naming is consistent and mechanical**, so any engineer can predict a file's location without asking: `kebab-case` folders and files, `PascalCase` classes/components, `camelCase` functions/variables, one exported primary thing per file matching the filename.

---

## 2. Monorepo layout

A single monorepo (Turborepo or Nx — Turborepo recommended for lower config overhead given your team size) keeps the web app, PWA-capture surface, backend API, and shared types in lockstep.

```
expense-tracker/
├── apps/
│   ├── api/                 # NestJS backend
│   ├── web/                 # Next.js web app (dashboard, settings, full desktop UI)
│   └── capture/             # Next.js PWA, mobile-first quick-capture surface
├── packages/
│   ├── ui/                  # Shared React component library (shadcn/ui-based, themed)
│   ├── types/                # Shared TypeScript types/DTOs used by both api and web/capture
│   ├── config/               # Shared eslint/tsconfig/tailwind config
│   └── utils/                 # Shared pure-function utilities (currency formatting, date math)
├── turbo.json
├── package.json
└── tsconfig.base.json
```

`web` and `capture` are two Next.js apps sharing `packages/ui` rather than one app with two modes — this keeps the capture PWA's bundle small and its UX laser-focused on speed, without dragging in the full dashboard's component weight. They share the same backend.

---

## 3. React / UI stack — recommendations and why

| Concern | Choice | Why |
|---|---|---|
| Component foundation | **shadcn/ui** (Radix UI primitives + Tailwind CSS) | The current default for new Tailwind/Next.js projects: components are copied into your repo (not an npm dependency), so you own and can restyle every pixel with no version-lock risk. Built on Radix, so accessibility (keyboard nav, focus management, ARIA) is correct out of the box. |
| Dashboard charts & KPI cards | **Tremor** | Purpose-built for exactly this app's Dashboard/Budget screens — KPI cards, area/bar/donut charts, progress bars, sparklines. Fully shadcn-compatible (same Tailwind theming), so it doesn't feel like a bolted-on second design language. |
| Data tables (transaction list, admin) | **TanStack Table** | Headless, so it renders through your own shadcn-styled `<table>` — sorting, filtering, pagination, virtualization for large transaction lists, without fighting a pre-styled grid. |
| Server state / data fetching | **TanStack Query** | Handles caching, refetch-on-focus, optimistic updates (critical for the two-tap quick-add flow feeling instant), and background refresh for the real-time dashboard requirement. |
| Forms | **React Hook Form** + **Zod** | React Hook Form for performant, minimally-re-rendering forms; Zod for schema validation shared between frontend form validation and backend DTO validation (one schema, two consumers — see Section 7). |
| Client-side state (UI-only, non-server) | **Zustand** | For things that are not server data — active household selector, capture-flow step state, theme. Avoid Redux; this app doesn't need its ceremony. |
| Icons | **Lucide React** | Same icon set already used in the Visualizer/shadcn ecosystem; consistent stroke weight, tree-shakeable. |
| Animation | **Framer Motion** | For the quick-add confirm animation, budget-health transitions, and the receipt-split flow — used sparingly, not as a base dependency. |
| Charts fallback for anything Tremor doesn't cover | **Recharts** | Tremor is built on Recharts, so dropping to raw Recharts for a bespoke chart (e.g. the multi-month trend view's custom interactions) stays visually consistent. |
| Real-time | **socket.io-client** | Matches the backend's Socket.IO choice (Section 5), and is the same pattern already proven in CRM_FE's chat feature. |

**What this buys you over a single all-in-one UI kit (MUI/Ant Design):** every component is Tailwind-based and lives in your repo, so the color system in Section 4 applies everywhere automatically via CSS variables — there's no fighting a separate theming API on top of your own design tokens.

---

## 4. Design system — color code

Semantic color coding matters more in a finance app than almost any other product category: a user should be able to glance at a number and know, without reading it, whether it's good or bad news.

### 4.1 Core palette (CSS variables, light / dark)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--brand-primary` | `#1F3A5F` (deep navy) | `#7FA5D1` | Primary actions, nav, headers |
| `--brand-accent` | `#0F6E56` (teal) | `#4ED9B5` | Secondary actions, links, active states |
| `--surface-base` | `#FFFFFF` | `#111318` | Page background |
| `--surface-card` | `#F7F8FA` | `#1B1E24` | Card backgrounds |
| `--border-default` | `#E2E5EA` | `#2A2E36` | Dividers, card borders |
| `--text-primary` | `#111318` | `#F1F2F4` | Body text |
| `--text-secondary` | `#5F6672` | `#9CA3AF` | Labels, captions |

### 4.2 Semantic transaction-type colors (the important part)

This is the encoding that should be **identical everywhere in the app** — dashboard KPI cards, transaction list icons, chart series, budget bars — so a user builds a one-glance visual vocabulary rather than re-reading labels every time.

| Transaction type | Color token | Hex (light) | Rationale |
|---|---|---|---|
| Income | `--type-income` | `#1D9E75` (green) | Universal "money in / good" convention |
| Expense | `--type-expense` | `#D85A30` (coral/red-orange) | "Money out" — deliberately coral rather than alarm-red, since most expenses are normal, not dangerous |
| Saving | `--type-saving` | `#378ADD` (blue) | Neutral-positive, distinct from income so a savings transfer doesn't read as "new money" |
| Debt given (money lent) | `--type-debt-given` | `#7F77DD` (purple) | Distinct third color — this is neither income nor expense in spirit, it's a claim on future money |
| Debt received (money borrowed) | `--type-debt-received` | `#BA7517` (amber) | Warm, slightly cautionary — it's a future obligation |

### 4.3 Budget-health indicator (traffic-light, ported from the source spreadsheet)

| State | Color | Threshold |
|---|---|---|
| Under budget | `#1D9E75` (green) | Actual < 80% of budgeted |
| Near budget | `#EF9F27` (amber) | Actual 80–100% of budgeted |
| Over budget | `#E24B4A` (red) | Actual > 100% of budgeted |

Per NFR-USAB-003 (SRS Section 5.3), every color-coded state also carries a non-color cue: an icon (check / warning-triangle / alert-circle from Lucide) alongside the color, never color alone.

### 4.4 Typography

- **Font:** Inter (variable font, excellent number-tabular support — important for a finance app where columns of amounts must align).
- **Numeric figures use `font-variant-numeric: tabular-nums`** everywhere amounts are displayed in a list or table, so digits align vertically.
- Scale: `text-xs` (12px) captions → `text-sm` (14px) body → `text-lg` (18px) card titles → `text-2xl`/`text-3xl` (24/30px) KPI figures.

### 4.5 Where this lives in code

All tokens above live in one file, `packages/ui/src/theme/tokens.css`, as CSS variables, consumed by Tailwind via `tailwind.config.ts`'s `theme.extend.colors` mapping to `var(--token-name)`. This is the single source of truth — no component ever hardcodes a hex value.

---

## 5. Backend architecture (NestJS) — code structure

### 5.1 Top-level structure

```
apps/api/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── decorators/
│   │   └── current-household.decorator.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── household-scope.guard.ts
│   ├── interceptors/
│   │   └── household-context.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── pipes/
│       └── zod-validation.pipe.ts
├── config/
│   └── configuration.ts
├── modules/
│   ├── auth/
│   ├── households/
│   ├── transactions/
│   ├── categories/
│   ├── classification/
│   ├── debts/
│   ├── budgets/
│   ├── receipts/
│   ├── imports/
│   ├── billing/
│   └── notifications/
└── database/
    ├── migrations/
    └── seeds/
```

Every entry under `modules/` follows the exact same internal shape. Shown in full for `transactions/`:

```
modules/transactions/
├── transactions.module.ts
├── transactions.controller.ts
├── transactions.service.ts
├── transactions.repository.ts
├── entities/
│   └── transaction.entity.ts
├── dto/
│   ├── create-transaction.dto.ts
│   ├── update-transaction.dto.ts
│   └── query-transactions.dto.ts
├── interfaces/
│   └── transaction.interface.ts
└── transactions.service.spec.ts
```

**Why split this way, file by file:**

- **`*.controller.ts`** — HTTP layer only: route decorators, request/response shape, calling the service. No business logic, ever.
- **`*.service.ts`** — business logic: validation beyond schema shape, orchestration across other services (e.g. calling `classification.service` to get a category suggestion before saving).
- **`*.repository.ts`** — the only file that talks to TypeORM directly. Services call repository methods, never `Repository<Transaction>` directly. This is what makes `transactions.service.spec.ts` mockable without a database.
- **`entities/`** — TypeORM entity classes (table shape) — kept separate from DTOs so a database-shape change doesn't ripple into API contracts unintentionally.
- **`dto/`** — Zod-validated request/response shapes (Section 7 shows the shared-schema pattern with the frontend).
- **`interfaces/`** — plain TypeScript types used internally, no decorators.

**Example — `create-transaction.dto.ts`:**

```typescript
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateTransactionSchema = z.object({
  date: z.coerce.date(),
  type: z.enum(["Income", "Expense", "Saving", "DebtGiven", "DebtReceived"]),
  categoryId: z.string().uuid().nullable(),
  amount: z.number().positive(),
  description: z.string().max(280).optional(),
  payee: z.string().max(120).optional(),
  source: z.enum(["manual", "receipt_ocr", "sms_parsed", "csv_import", "bank_sync"]),
});

export class CreateTransactionDto extends createZodDto(CreateTransactionSchema) {}
```

**Example — `transactions.repository.ts` (the only file touching the ORM):**

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Transaction } from "./entities/transaction.entity";

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectRepository(Transaction) private readonly repo: Repository<Transaction>
  ) {}

  findByHouseholdAndMonth(householdId: string, start: Date, end: Date) {
    return this.repo.find({
      where: { householdId, date: Between(start, end) },
      order: { date: "DESC" },
    });
  }

  createOne(data: Partial<Transaction>) {
    return this.repo.save(this.repo.create(data));
  }
}
```

**Example — `transactions.service.ts` (business logic, calls the classification module for a category suggestion, no ORM knowledge):**

```typescript
import { Injectable } from "@nestjs/common";
import { TransactionsRepository } from "./transactions.repository";
import { ClassificationService } from "../classification/classification.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly classification: ClassificationService
  ) {}

  async create(householdId: string, userId: string, dto: CreateTransactionDto) {
    let categoryId = dto.categoryId;
    let aiConfidence: number | null = null;

    if (!categoryId && dto.description) {
      const suggestion = await this.classification.suggestCategory(householdId, dto.description);
      categoryId = suggestion.categoryId;
      aiConfidence = suggestion.confidence;
    }

    return this.repo.createOne({
      ...dto,
      householdId,
      createdByUserId: userId,
      categoryId,
      aiConfidence,
      userConfirmedCategory: !!dto.categoryId,
    });
  }
}
```

This same five/six-file pattern is applied identically to every other module (`households`, `categories`, `classification`, `debts`, `budgets`, `receipts`, `imports`, `billing`, `notifications`) — same file names, same responsibilities, just different business logic inside `*.service.ts`. An engineer who's read `transactions/` can navigate `debts/` without a tour.

### 5.2 Cross-cutting concerns

- **`HouseholdScopeGuard`** runs on every request, resolving the authenticated user's active household from the JWT and attaching it to the request context (`common/decorators/current-household.decorator.ts` then lets any controller pull it with `@CurrentHousehold() householdId: string`). This is what makes SRS requirement FR-AUTH-007 (no cross-household leakage) structurally enforced rather than something each controller has to remember to check.
- **`ZodValidationPipe`** replaces `class-validator` globally — this is what lets a Zod schema be shared verbatim between the NestJS DTO and the React Hook Form on the frontend (Section 7).

---

## 6. Frontend architecture (Next.js) — code structure

### 6.1 Top-level structure (`apps/web`)

```
apps/web/src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── transactions/
│   │   │   └── page.tsx
│   │   ├── budgets/
│   │   │   └── page.tsx
│   │   ├── debts/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── (auth)/
│       ├── login/page.tsx
│       └── invite/[token]/page.tsx
├── features/
│   ├── transactions/
│   ├── budgets/
│   ├── debts/
│   ├── categories/
│   └── dashboard/
├── lib/
│   ├── api-client.ts
│   ├── query-client.ts
│   └── socket-client.ts
├── stores/
│   └── use-household-store.ts
└── styles/
    └── globals.css
```

`app/` holds **routes only** — thin page files that compose components from `features/`. All real UI logic lives in `features/`, mirroring the backend's `modules/` split exactly (same feature names on both sides — this symmetry is deliberate and makes cross-referencing the SRS's `FR-*` IDs to code trivial).

### 6.2 Inside a feature folder — shown in full for `features/transactions/`

```
features/transactions/
├── components/
│   ├── TransactionList.tsx
│   ├── TransactionRow.tsx
│   ├── TransactionForm.tsx
│   ├── QuickAddSheet.tsx
│   └── CategoryConfirmChip.tsx
├── hooks/
│   ├── useTransactions.ts
│   ├── useCreateTransaction.ts
│   └── useCategorySuggestion.ts
├── api/
│   └── transactions.api.ts
├── schema/
│   └── transaction.schema.ts
└── types/
    └── transaction.types.ts
```

- **`api/transactions.api.ts`** — the *only* file in this feature that constructs a URL or calls the shared `apiClient`. Every hook calls through here, never `fetch` directly.
- **`hooks/`** — TanStack Query wrappers. Components never call the API layer directly; they call a hook, which is what makes loading/error states and caching consistent everywhere.
- **`components/`** — presentational + lightly interactive components, each doing one job (`TransactionRow` renders one row; it does not fetch data).
- **`schema/transaction.schema.ts`** — re-exports the same Zod schema shape as the backend's DTO (Section 7), used directly by React Hook Form's resolver.

**Example — `api/transactions.api.ts`:**

```typescript
import { apiClient } from "@/lib/api-client";
import type { Transaction, CreateTransactionInput } from "../types/transaction.types";

export const transactionsApi = {
  list: (params: { month: string }) =>
    apiClient.get<Transaction[]>("/transactions", { params }),

  create: (input: CreateTransactionInput) =>
    apiClient.post<Transaction>("/transactions", input),
};
```

**Example — `hooks/useCreateTransaction.ts` (optimistic update, so quick-add feels instant per NFR-PERF-001):**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "../api/transactions.api";

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.create,
    onMutate: async (newTxn) => {
      await queryClient.cancelQueries({ queryKey: ["transactions"] });
      const previous = queryClient.getQueryData(["transactions"]);
      queryClient.setQueryData(["transactions"], (old: any) => [newTxn, ...(old ?? [])]);
      return { previous };
    },
    onError: (_err, _newTxn, context) => {
      queryClient.setQueryData(["transactions"], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });
}
```

**Example — `components/QuickAddSheet.tsx` (composes the hook + shared UI, stays thin):**

```tsx
import { Button } from "@expense-tracker/ui/button";
import { AmountInput } from "@expense-tracker/ui/amount-input";
import { CategoryConfirmChip } from "./CategoryConfirmChip";
import { useCreateTransaction } from "../hooks/useCreateTransaction";
import { useCategorySuggestion } from "../hooks/useCategorySuggestion";

export function QuickAddSheet() {
  const { mutate: createTransaction, isPending } = useCreateTransaction();
  const { suggestion, suggest } = useCategorySuggestion();

  return (
    <div className="flex flex-col gap-3 p-4">
      <AmountInput onBlurComplete={(description) => suggest(description)} />
      {suggestion && <CategoryConfirmChip suggestion={suggestion} />}
      <Button
        variant="primary"
        loading={isPending}
        onClick={() => createTransaction({ /* form values */ })}
      >
        Save
      </Button>
    </div>
  );
}
```

This exact structure — `components/`, `hooks/`, `api/`, `schema/`, `types/` — repeats for `budgets/`, `debts/`, `categories/`, `dashboard/`. Nothing about any feature's internal organization needs to be re-learned.

### 6.3 `packages/ui` — the shared component library

```
packages/ui/src/
├── theme/
│   └── tokens.css               # Section 4's color tokens, single source of truth
├── button.tsx
├── card.tsx
├── amount-input.tsx
├── badge.tsx                    # used for budget-health / debt-status indicators
├── kpi-card.tsx                 # Tremor-based, used across Dashboard
└── data-table.tsx               # TanStack Table wrapper, styled with shadcn primitives
```

Every shadcn component you pull in is generated straight into this package (`npx shadcn add button` targeting `packages/ui`), not duplicated into `apps/web` and `apps/capture` separately.

---

## 7. The shared-schema pattern (why frontend and backend never drift)

A single Zod schema, defined once in `packages/types`, is imported by:
1. The NestJS DTO (`createZodDto(schema)` — Section 5.1), enforcing it server-side.
2. The React Hook Form resolver (`zodResolver(schema)`), enforcing the identical rules client-side before the request is even sent.

```
packages/types/src/
└── schemas/
    └── transaction.schema.ts   # imported by BOTH apps/api and apps/web
```

This eliminates an entire category of bug (frontend validation rules quietly diverging from backend ones) and is the reason `apps/api` and `apps/web` live in the same monorepo rather than separate repos.

---

## 8. Database schema

### 8.1 Entity-relationship diagram

```
erDiagram
  HOUSEHOLDS ||--o{ HOUSEHOLD_MEMBERS : has
  USERS ||--o{ HOUSEHOLD_MEMBERS : belongs_to
  HOUSEHOLDS ||--o{ ACCOUNTS : owns
  HOUSEHOLDS ||--o{ CATEGORIES : defines
  HOUSEHOLDS ||--o{ TRANSACTIONS : logs
  ACCOUNTS ||--o{ TRANSACTIONS : records
  CATEGORIES ||--o{ TRANSACTIONS : classifies
  HOUSEHOLDS ||--o{ DEBTS : tracks
  DEBTS ||--o{ TRANSACTIONS : settled_by
  HOUSEHOLDS ||--o{ BUDGETS : sets
  CATEGORIES ||--o{ BUDGETS : targets
  TRANSACTIONS ||--o{ RECEIPTS : attaches
  HOUSEHOLDS ||--o{ SUBSCRIPTIONS : pays_for

  TRANSACTIONS {
    uuid id PK
    uuid household_id FK
    uuid category_id FK
    uuid created_by_user_id FK
    date txn_date
    string type
    numeric amount
    string currency
    string description
    string source
    numeric ai_confidence
    boolean user_confirmed_category
  }
  DEBTS {
    uuid id PK
    uuid household_id FK
    string person_name
    string direction
    numeric principal_amount
    date opened_date
    string status
  }
```

*(Full entity field list is in the SRS, Section 6.1, and the Technical Build Plan, Section 2 — this diagram is the quick-reference version.)*

### 8.2 Migration strategy

- TypeORM migrations, one file per schema change, committed alongside the PR that needs it — never rely on `synchronize: true` outside local dev.
- Migration file naming: `{timestamp}-{short-description}.ts` (TypeORM's default), stored in `apps/api/src/database/migrations/`.
- Each phase in Section 9 below lists its migrations explicitly, so the migration history reads as a changelog of the phase plan.

### 8.3 Seed data

`apps/api/src/database/seeds/default-categories.seed.ts` seeds every new household with the default category list (FR-CAT-001) — one seed file per seedable concern, not one giant seed script.

---

## 9. Phase-by-phase plan

Each phase lists: goal, new DB migrations, new/changed backend modules, new frontend features, libraries introduced, and exit criteria. This maps directly onto the SRS's `FR-*` requirement IDs and the priorities set there.

### Phase 0 — Foundation (2–3 weeks)

**Goal:** A working skeleton you can log into, with your own spreadsheet's data imported and matching, dogfoodable end to end.

| Area | Deliverable |
|---|---|
| DB migrations | `households`, `users`, `household_members`, `categories`, `transactions` (core tables only) |
| Backend modules | `auth/`, `households/`, `categories/`, `transactions/` (Create/Read only), `imports/` (CSV) |
| Frontend features | Login/invite flow, household switcher, transaction list, CSV import wizard |
| Libraries introduced | shadcn/ui base set, TanStack Query, TanStack Table, React Hook Form + Zod |
| Exit criteria | Your own 337-row sheet imports via `imports/` and the resulting transaction list totals match the spreadsheet's Dashboard sheet exactly (SRS Section 6.3 acceptance fixture) |

### Phase 1 — MVP wedge (4–6 weeks)

**Goal:** The product is independently useful without any phase-2/3 capability — this is what goes to the first real users from the validation outreach.

| Area | Deliverable |
|---|---|
| DB migrations | `debts`, `budgets`, `subscriptions`, add `ai_confidence`/`user_confirmed_category` columns to `transactions` |
| Backend modules | `classification/` (Bedrock categorization), `debts/`, `budgets/`, `billing/` (Stripe) |
| Frontend features | Quick-add capture UI (`apps/capture`), category-confirm chip, debt ledger screens, budget-vs-actual screen, Dashboard KPI cards + category breakdown (Tremor) |
| Libraries introduced | Tremor, Zustand, Framer Motion (quick-add confirm animation) |
| Exit criteria | A new user can sign up, import or manually log a month of transactions, get AI category suggestions above the confidence threshold at least 70% of the time, set a budget, and see accurate variance — all without touching a spreadsheet |

### Phase 2 — Capture automation (4–5 weeks)

**Goal:** Solve the entry-friction problem directly — this is the differentiation layer.

| Area | Deliverable |
|---|---|
| DB migrations | `receipts` table, `accounts` table (for future bank-sync readiness, unused until Phase 3) |
| Backend modules | `receipts/` (Textract + Bedrock pipeline), `notifications/` (Socket.IO), SMS-parsing endpoint inside `imports/` |
| Frontend features | Receipt capture flow + "split this receipt" UI, real-time household activity feed, budget-threshold notifications, Android SMS opt-in flow (native permission bridge from the PWA) |
| Libraries introduced | socket.io-client, a lightweight camera-capture wrapper for the PWA |
| Exit criteria | A receipt photo produces a correctly categorized transaction (or a clean split) without manual re-typing in the common case; a household member's edit appears on another member's screen without a refresh |

### Phase 3 — Geography expansion (4–6 weeks, gated on Phase 1–2 retention data)

**Goal:** Only pursued if validation from Phase 1–2 supports it — expands the addressable market to US/UK/EU with bank-sync as a premium differentiator, per FR-BANK-* in the SRS (explicitly future-scope there for the same reason).

| Area | Deliverable |
|---|---|
| DB migrations | `plaid_item_id` and token fields on `accounts`, `currency` normalization pass across `transactions` |
| Backend modules | New `bank-sync/` module (Plaid integration), multi-currency support in `transactions.service.ts` |
| Frontend features | Bank-linking flow (Plaid Link), currency selector in settings |
| Libraries introduced | `react-plaid-link` |
| Exit criteria | A US/UK test account can link a bank, see auto-imported transactions correctly categorized, and multi-currency totals compute correctly on the Dashboard |

---

## 10. Testing & CI structure

```
apps/api/src/modules/transactions/
└── transactions.service.spec.ts     # unit tests, one spec file colocated per service

apps/web/src/features/transactions/
└── __tests__/
    └── TransactionRow.test.tsx      # component tests, colocated per feature

e2e/
└── transactions.spec.ts             # Playwright, cross-app flows (capture -> api -> web dashboard)
```

- **Backend:** Jest, one `.spec.ts` colocated next to the service it tests — mocking the repository layer (Section 5.1's separation is what makes this possible without a database).
- **Frontend:** Vitest + React Testing Library for components, colocated in a `__tests__/` folder per feature.
- **E2E:** Playwright, one suite per cross-cutting user flow (quick-add → dashboard update, receipt → transaction, CSV import → dashboard match), run in CI on every PR to `main`.
- **CI:** GitHub Actions, one workflow per app (`api`, `web`, `capture`) using Turborepo's caching so unaffected packages skip re-testing on every push.

---

## 11. Naming & reusability conventions (quick reference)

| Rule | Example |
|---|---|
| Folders: `kebab-case` | `transactions/`, `household-members/` |
| Files: match their primary export, `kebab-case.ts` / `PascalCase.tsx` for components | `transactions.service.ts`, `TransactionRow.tsx` |
| One default export per file, named to match the file | `TransactionRow.tsx` exports `TransactionRow` |
| No file over ~200 lines as a working ceiling | Once a service file crosses this, it's usually doing two jobs — split it |
| Shared code promoted to `packages/` only on its second real use | Don't pre-build a "utils" grab-bag before there's a second consumer |
| Every new module ships the same five/six files from Section 5.1 | No exceptions, even for a module that feels "too simple to need a repository layer" — consistency beats micro-optimization here |
