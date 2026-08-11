# Cursor Execution Playbook — Expense Tracker SaaS

*How to turn the SRS + Implementation Plan into actual code in Cursor, without the plan getting lost after the third prompt. This is a workflow guide plus copy-paste prompts, sequenced to match the phases in the Implementation Plan.*

---

## 0. Before you write a single prompt: set up the repo so Cursor can't drift

Cursor is only as good as the context it has *by default*, without you re-pasting the plan every time. Do this once, first.

### 0.1 Put the three planning docs in the repo itself

```
expense-tracker/
├── docs/
│   ├── feasibility-study.md
│   ├── srs.md
│   └── implementation-plan.md
```

Export the SRS content to markdown alongside it (or keep the docx and add a plain-text `srs.md` summary — Cursor reads markdown far more reliably than docx). This means every prompt can reference `@docs/implementation-plan.md` and Cursor pulls in the real spec instead of your paraphrase of it.

### 0.2 Create a `.cursor/rules` file — this is the single most important step

This is what stops Cursor from reverting to "one big file" or a generic component library the moment you're not watching. Create `.cursor/rules/project.mdc`:

```markdown
---
description: Core project conventions — apply to all code in this repo
alwaysApply: true
---

# Expense Tracker — project rules

This project follows docs/implementation-plan.md exactly. Before generating code for
any module or feature, check that document's Section 5 (backend) or Section 6 (frontend)
for the required file structure.

## Non-negotiable structure rules

- Never put a controller, service, and repository in one file. Every backend module
  gets: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`,
  `entities/`, `dto/`, `interfaces/` — as separate files, exactly as shown in
  docs/implementation-plan.md Section 5.1.
- Controllers contain ONLY HTTP concerns (routes, status codes, calling the service).
  No business logic in a controller, ever.
- Services never import TypeORM's Repository directly — only the module's own
  `*.repository.ts` file does that.
- Every frontend feature gets: `components/`, `hooks/`, `api/`, `schema/`, `types/`
  as shown in Section 6.2. Components never call `fetch` or the API client directly —
  always through a hook in `hooks/`.
- No file should exceed ~200 lines. If it does, stop and split it before continuing.
- Reuse `packages/ui` components before creating a new one. Never duplicate a
  component into apps/web and apps/capture separately.

## Design system

- All colors come from CSS variables defined in packages/ui/src/theme/tokens.css
  (see implementation-plan.md Section 4). Never hardcode a hex value in a component.
- Transaction-type colors are fixed: Income=green, Expense=coral, Saving=blue,
  DebtGiven=purple, DebtReceived=amber. Use these consistently everywhere.

## Stack (do not substitute without asking first)

- Backend: NestJS + TypeORM + Zod (via nestjs-zod), Postgres
- Frontend: Next.js App Router, shadcn/ui, Tremor (charts/KPIs), TanStack Query,
  TanStack Table, React Hook Form + Zod, Zustand, Framer Motion, Lucide icons
- Shared Zod schemas live in packages/types and are imported by both the NestJS DTO
  and the React Hook Form resolver — never redefine a schema in two places.

## When in doubt

Re-read docs/implementation-plan.md and docs/srs.md before inventing a new pattern.
If the docs don't cover it, ask rather than improvising a structure.
```

This single file does more work than any individual prompt below — Cursor rereads it on every request in the repo, so you stop having to repeat "don't put it all in one file" every session.

### 0.3 One Cursor chat/composer session per phase, not one giant session

Start a **fresh chat per module**, not one marathon thread for all of Phase 0. Long threads degrade — Cursor starts forgetting the rules file's specifics after enough back-and-forth. Small, scoped sessions also give you a natural commit checkpoint.

### 0.4 Commit after every module, not after every phase

`git commit` once a module's five/six files are in and passing its own test, before moving to the next module. If a later prompt goes sideways, you want a clean point to reset to that isn't "the whole phase."

---

## 1. Workflow pattern for every prompt

Use this shape every time, regardless of phase:

1. **Reference the doc explicitly.** `@docs/implementation-plan.md` (Cursor's `@` file-mention, not a paste) so it reads the actual current version, not a stale copy in your prompt.
2. **Name the exact module/feature and its file list.** Don't say "build the transactions API" — say "build the transactions module with these exact files: ..." and list them, even though the rules file already says this. Redundancy here is cheap insurance.
3. **Ask for one module or feature at a time.** Never "build Phase 0" in one prompt — that's how you get a 2,000-line diff you can't review properly.
4. **Review the diff before accepting.** Specifically check: did it split files the way the rules say, did it hardcode any color, did the controller stay free of business logic.
5. **Ask it to write the test file in the same prompt**, not as an afterthought — `*.service.spec.ts` should exist before you move on.

---

## 2. Phase 0 prompts (foundation)

### 2.1 Scaffold the monorepo

```
Set up a Turborepo monorepo exactly as specified in @docs/implementation-plan.md
Section 2 (Monorepo layout). Create the folder structure only — apps/api,
apps/web, apps/capture, packages/ui, packages/types, packages/config, packages/utils —
with minimal placeholder package.json and tsconfig files in each, wired up so
`turbo run dev` and `turbo run build` work across all apps. Do not add any business
logic yet — this prompt is scaffolding only.
```

### 2.2 Backend cross-cutting concerns first

```
In apps/api, set up the common/ folder exactly as described in
@docs/implementation-plan.md Section 5.2: the HouseholdScopeGuard,
CurrentHousehold decorator, ZodValidationPipe, and a global HttpExceptionFilter.
Use nestjs-zod for validation. Do not build any feature module yet — this is
infrastructure only. Include a short README in common/ explaining what each
piece does and why (guard resolves household from JWT, decorator exposes it to
controllers, etc.) so future modules use it correctly.
```

### 2.3 Households module

```
Build the households module in apps/api/src/modules/households/, following the
exact file structure in @docs/implementation-plan.md Section 5.1 (module,
controller, service, repository, entities/, dto/, interfaces/, spec file).
Cover SRS requirements FR-AUTH-001 through FR-AUTH-007 from @docs/srs.md —
household creation on first user registration, member invite by email, Owner
vs Member roles, and household removal. Use the HouseholdScopeGuard from
common/ on every route that isn't the invite-acceptance endpoint. Write
households.service.spec.ts covering at minimum: default household created on
registration, and a removed member losing access.
```

### 2.4 Categories module

```
Build the categories module in apps/api/src/modules/categories/, same file
structure as households/. Cover FR-CAT-001 and FR-CAT-002 from @docs/srs.md:
seed a default category list per household (implement the seed in
apps/api/src/database/seeds/default-categories.seed.ts, not inline in the
service), and support create/rename/deactivate/reorder and parent-child
nesting. Do not implement AI suggestion yet — that's the classification
module, a separate prompt.
```

### 2.5 Transactions module (Create/Read only for Phase 0)

```
Build the transactions module in apps/api/src/modules/transactions/, using the
exact code shown as the worked example in @docs/implementation-plan.md
Section 5.1 as your structural template (not literally, but same file
responsibilities). Implement FR-TXN-001, FR-TXN-004, FR-TXN-005, FR-TXN-006
from @docs/srs.md — create and list/filter/search only, no AI categorization
yet (categoryId is a required manual field for this phase, classification
comes in Phase 1). Amounts must be stored as decimal/numeric, never floating
point. Write the repository so it's mockable in transactions.service.spec.ts
without a real database connection.
```

### 2.6 CSV import

```
Build the imports module in apps/api/src/modules/imports/ covering FR-IMP-001
through FR-IMP-004 from @docs/srs.md: CSV upload, column-to-field mapping,
unmapped-category detection and one-time remap, a preview step before commit,
and tagging created transactions with source = 'csv_import'. This is the
Phase 0 acceptance fixture per @docs/implementation-plan.md Section 9 — the
import must be able to take the structure of a spreadsheet with sheets named
Transactions/Categories/Debts/Budget/Dashboard and produce transactions whose
monthly totals match that spreadsheet's own Dashboard sheet. Ask me for a
sample export of my actual sheet if you need concrete column names to map
against.
```

### 2.7 Frontend: auth, household switcher, transaction list, import wizard

```
In apps/web, build the (auth) route group (login, invite acceptance) and the
(dashboard) route group's transactions page, following
@docs/implementation-plan.md Section 6 exactly: app/ holds only thin page
files, all real logic lives in features/transactions/ with the
components/hooks/api/schema/types split shown in Section 6.2. Use shadcn/ui
for all base components (generate them into packages/ui, don't inline shadcn
components in apps/web). Build a household switcher using Zustand for the
active-household state per Section 3. Include a CSV import wizard UI that
calls the imports module's endpoints, with a preview step matching
FR-IMP-003.
```

### 2.8 Verify the exit criterion

```
I've imported my real spreadsheet via the CSV import wizard. Walk me through
how to verify, using the transactions list and any aggregation endpoints we've
built so far, that the monthly totals match my spreadsheet's Dashboard sheet
exactly, per the Phase 0 exit criterion in @docs/implementation-plan.md
Section 9. If there's a mismatch, help me find whether it's an import mapping
bug or an aggregation query bug before we move to Phase 1.
```

---

## 3. Phase 1 prompts (MVP wedge)

### 3.1 Classification module

```
Build the classification module in apps/api/src/modules/classification/,
same file structure pattern as prior modules (module, controller, service,
repository if needed, entities/, dto/, interfaces/, spec file). Implement
FR-CAT-003 through FR-CAT-006 from @docs/srs.md: given a transaction
description, call the Google Gemini API (use @google/genai, model
gemini-2.5-flash-lite) to return a suggested categoryId and a confidence
score. Store the API key via GEMINI_API_KEY env var, following the same
config-loading pattern as apps/api/src/config/configuration.ts already uses
for other secrets. Store household-specific confirmed/overridden examples
and include the most recent ones as few-shot context in the prompt. Do not
couple this module directly to the transactions module's internals —
transactions.service.ts should call classification.service.ts through its
public method only. Ask me for exact prompt wording/taxonomy expectations if
the category list format isn't clear from the categories module's schema.
```

### 3.2 Debts module

```
Build the debts module in apps/api/src/modules/debts/, covering FR-DEBT-001
through FR-DEBT-007 from @docs/srs.md. The core logic to get right is
FR-DEBT-002 and FR-DEBT-004: auto-linking Debt Repayment / Debt Received
transactions to the correct open debt entry for the same person+direction,
using a date-windowed lookup so that repayments are attributed to the most
recent debt instance when a new one has been opened for the same person. This
mirrors SUMIFS/MINIFS formulas in the original spreadsheet's Debts sheet —
ask me to show you that sheet's formulas from @docs/feasibility-study.md if
the date-window logic isn't clear from the SRS description alone.
```

### 3.3 Budgets module

```
Build the budgets module in apps/api/src/modules/budgets/, covering
FR-BUD-001 through FR-BUD-006. Actual-spend-per-category must recompute
automatically whenever a transaction in that category/month changes — don't
build this as a stored/cached value that needs manual refresh. Include the
savings-rate calculation from FR-BUD-005.
```

### 3.4 Billing module

```
Build the billing module in apps/api/src/modules/billing/, covering
FR-BILL-001 through FR-BILL-007. Use Stripe. This must include webhook
signature verification and idempotency handling per NFR-SEC-004 — if you're
familiar with how Draftlee's Stripe hardening pass handled idempotency keys
and webhook guards, apply the same pattern here rather than a simpler
approach. Enforce free-tier limits server-side (FR-BILL-007), not just in the
UI.
```

### 3.5 Frontend: quick-add, debts, budgets, dashboard

```
Build features/dashboard/, features/budgets/, and features/debts/ in
apps/web (and the quick-add capture flow in apps/capture) following the same
component/hooks/api/schema/types structure as features/transactions/ from
Phase 0. Use Tremor for the Dashboard's KPI cards and category-breakdown
chart per @docs/implementation-plan.md Section 3. The quick-add flow in
apps/capture must complete a save in two taps for the common case (amount +
category only) per FR-TXN-002 and NFR-PERF-001 — use the optimistic-update
pattern shown in Section 6.2's useCreateTransaction example so it feels
instant even before the server confirms.
```

---

## 4. Phase 2 prompts (capture automation)

```
Build the receipts module (apps/api/src/modules/receipts/) covering
FR-RCPT-001 through FR-RCPT-006: S3 presigned upload, AWS Textract
AnalyzeExpense or Gemini multimodal for extraction, then classification
(via classification.service.ts, reused rather than duplicated) for category
mapping. Include the "split this receipt" flow from FR-RCPT-004/FR-TXN-007 as
a distinct step, not bolted onto the create-transaction endpoint.
```

```
Add real-time household sync using Socket.IO, covering FR-NOTIF-002 and
FR-DASH-006. Set this up as its own notifications module
(apps/api/src/modules/notifications/), not scattered socket.emit() calls
inside other services — other modules should call a single method on
notifications.service.ts to broadcast an event, keeping the socket
implementation detail contained to one place.
```

```
Build the Android SMS/notification-capture opt-in flow per FR-SMS-001 through
FR-SMS-007, defaulting to fully disabled, with an explicit permission screen,
and confirm this flow is never presented on iOS per FR-SMS-007. Parsed
transactions must always be shown as drafts requiring one confirming action
(FR-SMS-004) — never auto-saved.
```

---

## 5. Phase 3 prompts (only after validation — bank sync)

```
Build the bank-sync module (apps/api/src/modules/bank-sync/) using Plaid,
covering FR-BANK-001 through FR-BANK-005. Access tokens must never be stored
in plaintext — use the encrypted-field pattern from NFR-SEC-002/NFR-SEC-003.
This module is additive: it must not require changes to how manually-entered
or receipt/SMS-captured transactions work, per the source-field design in
Section 8.1's transactions table.
```

---

## 6. Guardrails while you work

- **If Cursor's diff puts business logic in a controller, business logic in a component, or a raw `fetch` outside `api/`, reject the diff and re-prompt** rather than accepting and fixing later — it's much cheaper to correct before it becomes the pattern the next module copies.
- **Periodically re-run the "read the rules file" check**: ask a fresh Cursor chat "list the file structure rules for this repo" and confirm it recites `.cursor/rules/project.mdc` correctly. If it doesn't, the rules file isn't being picked up and needs fixing before you generate more code against a blind spot.
- **Don't let Cursor choose the UI library per-component.** If a prompt's output pulls in a component from somewhere other than shadcn/ui/Tremor without you asking, that's model drift, not a legitimate substitution — reject it.
- **Re-run the Phase 0 exit-criterion check after Phase 1 and Phase 2 too.** Re-importing your own sheet and comparing totals is a cheap regression test you already have for free — use it every phase, not just once.
