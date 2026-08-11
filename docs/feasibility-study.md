# Technical Build Plan — Expense Tracker SaaS

*Companion to the feasibility study. This is the "how we'd actually build it" document, scoped to your existing stack (NestJS/TypeORM, Next.js, Neon Postgres, AWS ECS Fargate, Stripe, Auth0, Google Gemini) so most of it is extension, not net-new learning.*

---

## 1. Stack decisions

| Layer | Choice | Why |
|---|---|---|
| Backend | NestJS + TypeORM | Same as CRM_BE. Reuse the module structure, guards, and permission system you already built for Monicio. |
| Frontend (web) | Next.js | Same as Draftlee/CRM_FE. |
| Mobile capture | PWA first, React Native later | A PWA gets you installable, camera-access, notification-listening (Android) capture without an app-store cycle for MVP. Move to React Native only once quick-capture usage justifies native push/background SMS listening. |
| Database | Postgres on Neon | Same as CRM_BE/Draftlee. Branching for staging, same ops muscle memory. |
| Auth | Auth0 | Same tenant pattern as the Monicio UK migration — ROPG or standard flow, Google Sign-In supported out of the box. |
| File/receipt storage | S3 + CloudFront | Same pattern as Draftlee's signature asset pipeline (S3 + CDN + presigned upload). |
| Hosting | AWS ECS Fargate | Same as Draftlee. No new deployment paradigm. |
| Billing | Stripe, dedicated account | Apply the 11-fix hardening pattern from Draftlee directly: idempotency keys, webhook signature guards, trial-abuse closure, Prisma/TypeORM transaction timeout handling. |
| OCR (receipts) | **Option A (default for Phase 2):** Gemini multimodal (`gemini-2.5-flash-lite` or Flash) — image in, structured line items + categories out. **Option B:** Textract `AnalyzeExpense` → classification.service for category mapping | Gemini collapses the two-stage extract+reason pipeline and is cheap enough on Flash-Lite. Textract remains valid if vision accuracy on messy photos needs a deterministic OCR step. |
| Push/real-time | Socket.IO | Reuse CRM_FE's chat infrastructure pattern for live budget updates across a shared household. |

Nothing here requires a new platform decision. The main new *service* is the OCR/categorization pipeline, and even that mirrors Monicio's 12-bank statement extractor almost exactly — same shape, smaller scope.

---

## 2. Data model

Multi-tenant unit is the **household** (a household is 1+ users sharing budgets/debts; a solo user is a household of one). This avoids bolting on multi-user sharing later — build it in from day one since it's cheap to do now and expensive to retrofit.

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

  HOUSEHOLDS {
    uuid id PK
    string name
    string base_currency
    timestamp created_at
  }
  USERS {
    uuid id PK
    string auth0_sub
    string email
    string display_name
  }
  HOUSEHOLD_MEMBERS {
    uuid id PK
    uuid household_id FK
    uuid user_id FK
    string role
  }
  ACCOUNTS {
    uuid id PK
    uuid household_id FK
    string name
    string type
    string plaid_item_id
    boolean is_manual
  }
  CATEGORIES {
    uuid id PK
    uuid household_id FK
    string name
    string type
    uuid parent_category_id FK
    boolean is_system_default
  }
  TRANSACTIONS {
    uuid id PK
    uuid household_id FK
    uuid account_id FK
    uuid category_id FK
    uuid created_by_user_id FK
    date txn_date
    string type
    numeric amount
    string currency
    string description
    string payee
    string source
    numeric ai_confidence
    boolean user_confirmed_category
    timestamp created_at
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
  BUDGETS {
    uuid id PK
    uuid household_id FK
    uuid category_id FK
    string month
    numeric budgeted_amount
  }
  RECEIPTS {
    uuid id PK
    uuid transaction_id FK
    string s3_key
    string ocr_status
    jsonb extracted_data
  }
  SUBSCRIPTIONS {
    uuid id PK
    uuid household_id FK
    string stripe_customer_id
    string plan
    string status
  }
```

Notes carried over directly from your own sheet's design, because they already work:

- **`type` on transactions** (Income / Expense / Saving / Debt Given / Debt Received) — keep this exact enum. It's the backbone of every dashboard query in your current Budget/Dashboard sheets and translates 1:1 into `SUMIFS`-equivalent SQL (`WHERE type = 'Expense' AND txn_date >= ... AND txn_date < ...`).
- **The debt ledger stays its own table**, not just a transaction category — your sheet's `Debts` sheet already proves this is the right shape (principal, direction, running repaid/remaining, auto-expiring window when a new debt with the same person+direction opens). Model `DEBTS.status` as a computed/materialized value from linked `TRANSACTIONS`, same logic as your `SUMIFS`/`MINIFS` formulas, just as a query instead of a formula.
- **`category_id` nullable + `ai_confidence` + `user_confirmed_category`** is the fix for the 52%-Misc problem. Every transaction gets an AI-suggested category on entry; the user can accept (1 tap) or override. Track confidence so low-confidence suggestions get surfaced for review, same pattern as Draftlee's classification confidence tiers.
- **`source` field on transactions** (`manual`, `receipt_ocr`, `sms_parsed`, `bank_sync`) — you'll want this from day one to debug categorization quality per input channel and to know which capture method actually gets used, since that's the retention question that matters most.

---

## 3. Backend module breakdown (NestJS)

Mirrors CRM_BE's module structure:

- `auth` — Auth0 integration, household-scoped guards (a user can belong to multiple households; every request resolves to a household context, same pattern as Monicio's role/permission guards).
- `households` — household CRUD, member invites, roles (owner/member).
- `transactions` — CRUD, list/filter/search, the core `SUMIFS`-equivalent aggregation endpoints for dashboard queries.
- `categories` — system defaults seeded per household on creation (mirrors your `Categories` sheet), user-editable, parent/child support for finer-grained categorization than your current flat list.
- `debts` — debt CRUD, auto-linking of `Debt Repayment`/`Debt Received` transactions to open debts, running balance calculation.
- `budgets` — month-scoped budget-vs-actual, variance, savings-rate calculation — direct port of your `Budget` sheet's logic.
- `receipts` — presigned S3 upload, Textract trigger, Bedrock category-mapping trigger, status polling.
- `classification` — the AI categorization service. Same architectural shape as Draftlee's 7-layer email classifier: confidence tiers, user feedback loop that retrains the per-household prompt/few-shot examples over time, versioned prompts with rollback.
- `billing` — Stripe subscriptions, webhooks, plan resolution. Port the 11-fix hardening pass wholesale: idempotency keys, webhook signature verification, trial-abuse guards, Prisma/TypeORM transaction timeout handling, account-deletion-with-invoice-voiding.
- `imports` — CSV import (for people migrating off a spreadsheet — this is your own use case, make it first-class), SMS-parsed transaction ingestion.
- `notifications` — budget-threshold alerts, debt-due reminders, shared-household activity feed (Socket.IO, same pattern as CRM_FE chat).

---

## 4. The categorization pipeline (the part that actually matters)

This is the feature that fixes the 52%-Misc problem, so it deserves its own detail.

**On manual entry (typed description):**
1. User types "Kingsburry uber + wheel + bus + plantea" and an amount.
2. Backend calls Google Gemini (`gemini-2.5-flash-lite`) via `classification.service` with the household's category list + a few recent confirmed examples as few-shot context.
3. Model returns a suggested category + confidence score.
4. High confidence (>0.85): pre-select the category, user just confirms with one tap.
5. Low confidence: surface top 2 suggestions as quick-pick chips, still one tap, but flagged internally for the feedback loop.
6. Every confirm/override is logged (`user_confirmed_category`) and feeds back into the few-shot examples for that household — the model gets better at *your* specific spending vocabulary over time, not just a generic categorizer.

**On receipt photo:**
1. Upload → S3 → Gemini multimodal (preferred) or Textract `AnalyzeExpense` (vendor, total, date, line items).
2. If extraction is separate: vendor + line items → classification.service for category mapping (same step as manual entry, now with structured input). With Gemini vision, extraction + categories can be one call.
3. If the receipt has multiple line items that logically split across categories (e.g. a supermarket receipt with food + household items), offer a "split this receipt" flow rather than forcing one category — this is a real gap in most competitor apps and a natural differentiator.

**On SMS/notification parsing (Android, no open-banking dependency):**
1. A notification-listener service (opt-in, explicit permission) captures bank/telco debit-alert notification text.
2. Regex + a small classification pass extracts amount, merchant, date.
3. Same categorization pipeline as manual entry.
4. This is the single highest-leverage feature for your home market specifically, since it gets you 80% of "bank sync" convenience with zero dependency on Plaid/open-banking infrastructure that doesn't exist there yet.

---

## 5. Multi-tenancy & security

- Household-scoped row-level access enforced at the guard level (NestJS interceptor checks household membership on every request) — same pattern as the permission system you already built for CRM_BE.
- Postgres RLS as a second line of defense (you've done this before on the CRM schema work) — belt-and-suspenders in case an application-layer bug leaks a query.
- Encrypt sensitive fields at rest (debt amounts, account balances) — standard column-level encryption, not full-disk-only.
- Auth0 tenant per environment (dev/staging/prod), same as the Monicio UK migration pattern.
- If you pursue the Plaid tier later: Plaid tokens never touch your database in plaintext-adjacent form — store only the encrypted `item_id`/access token via a secrets-manager-backed field, same discipline as the Stripe secret rotation you did on Draftlee.
- Financial data is a heightened trust category even without bank-linking — plan for a clear, published data-deletion flow and no third-party data resale, both called out repeatedly in competitor reviews as trust factors that drive churn when absent.

---

## 6. Delivery phases

**Phase 0 — foundation (2–3 weeks)**
Household/user/auth model, category seeding, manual transaction CRUD, CSV import (so you can migrate your own sheet's 337 rows on day one and dogfood immediately).

**Phase 1 — MVP wedge (4–6 weeks)**
Quick-add capture UI, Bedrock categorization with confidence-tiered confirm flow, debt ledger with auto-linking, budget-vs-actual dashboard (direct port of your Budget/Dashboard sheet logic), Stripe freemium billing.

**Phase 2 — capture automation (4–5 weeks)**
Receipt OCR (Gemini vision and/or Textract + classification), Android SMS/notification parsing, shared-household real-time sync (Socket.IO), budget-threshold notifications.

**Phase 3 — geography expansion (4–6 weeks, only after Phase 1–2 retention validates)**
Plaid bank-sync integration for US/UK/EU users as a premium tier, multi-currency support, CASA-equivalent security review if you add any Gmail/Calendar-style OAuth scopes down the line.

Total to a genuinely usable, dogfoodable MVP (Phase 0+1): roughly **6–9 weeks** at the pace your recent Draftlee/Monicio ship history suggests, most of it backend-module and prompt-tuning work rather than new infrastructure.

---

## 7. What to build vs. buy

| Component | Build or buy | Reasoning |
|---|---|---|
| Categorization AI | Build (Gemini via `@google/genai`) | Isolated behind `classification.service`. Flash-Lite is cheap enough for continuous categorization; multimodal path also unlocks simpler receipts in Phase 2. Trade-off vs original Bedrock plan: loses Draftlee AWS IAM reuse, gains one new API relationship. |
| Receipt OCR | Build on Gemini vision (preferred) or Buy (Textract) + build (mapping) | Prefer single multimodal call; keep Textract as fallback if vision accuracy lags on messy photos. |
| Bank aggregation (Phase 3 only) | Buy (Plaid) | Building bank connectivity yourself is a multi-year, compliance-heavy undertaking. Not viable to build in-house at this stage regardless of market. |
| Billing | Buy (Stripe) + reuse your hardening pattern | Already solved once at Draftlee; port, don't rebuild. |
| SMS/notification parsing | Build | No good third-party product does this well for South Asian bank/telco formats — it's also your clearest differentiator, worth owning. |

---

## 8. Open technical decisions to make early (not blocking, but decide before Phase 1 ends)

- Single NestJS monolith vs. splitting `classification`/`receipts` into a separate service — given your Draftlee/Monicio pattern of monoliths-that-work, default to monolith until a specific scaling reason appears.
- Whether household currency is single (simpler, matches your sheet today) or multi-currency from day one (needed eventually for the geography-expansion phase, but adds real complexity to every aggregation query) — recommend single-currency for Phase 0–2, multi-currency as an explicit Phase 3 migration.
- Mobile: PWA-only until usage data justifies React Native (push notifications, background SMS listening, and offline-first capture are the concrete triggers to watch for).
