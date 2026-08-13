# Phase 0 exit criterion — verify spreadsheet totals (playbook §2.8)

Exit goal (implementation-plan §9): after CSV import, **monthly totals match the source spreadsheet Dashboard sheet**.

Reference fixture: [`fixtures/phase0-dashboard-expected.json`](./fixtures/phase0-dashboard-expected.json)  
Source workbook: `Expense_Tracker_Automation Last.xlsx` (337 Transactions rows).

---

## 0. Preconditions

1. API + Postgres running (`TYPEORM_SYNC=true` or migrations applied).
2. Web app at `http://localhost:3000`.
3. Signed JWT (`JWT_SECRET`) and login/bootstrap complete.
4. Export the **Transactions** sheet as CSV (headers: `Date,Day,Type,Category,Person/Payee,Description,Amount (Rs),Notes`).

---

## 1. Import

1. Open **Import** (`/transactions/import`).
2. Upload the CSV → accept suggested column mapping → **Preview**.
3. For every **unmapped category**, click **Create category** (or map to an existing id), then **Re-run preview**.
4. When `canCommit` is true and `readyCount` ≈ **336** (one blank-date row should fail), **Commit**.

### Known sheet quirks (import mapping, not aggregation)

| Issue | Symptom | Fix |
|-------|---------|-----|
| Blank `Date` row (Clothing · Tailor 700) | 1 failed parse row | Expected — Dashboard used dated rows only |
| Labels like `Daily Routine/Misc`, `Food & Snacks` | unmapped categories | Create category or remap once |
| Excel serial dates | usually auto-parsed | If wrong year/month, mapping bug → check `normalizeDate` |

---

## 2. Verify with API summary

```http
GET /transactions/summary?month=2026-08
Authorization: Bearer <jwt>
X-Household-Id: <household-uuid>
```

Response shape:

```json
{
  "month": "2026-08",
  "dateFrom": "2026-08-01",
  "dateTo": "2026-08-31",
  "count": 21,
  "byType": {
    "Income": "72452.00",
    "Expense": "45481.00",
    "Saving": "0.00",
    "DebtGiven": "0.00",
    "DebtReceived": "0.00"
  },
  "netBalance": "26971.00"
}
```

### Dashboard acceptance months (Income / Expense)

| Month | Dashboard Income | Dashboard Expense | Net (I−E) |
|-------|------------------|-------------------|-----------|
| 2026-01 | 88104.00 | 51551.00 | 36553.00 |
| 2026-02 | 155657.00 | 134887.00 | 20770.00 |
| 2026-03 | 119965.00 | 101170.00 | 18795.00 |
| 2026-04 | 179482.00 | 162040.00 | 17442.00 |
| 2026-05 | 216245.00 | 186326.00 | 29919.00 |
| 2026-06 | 172769.00 | 158620.00 | 14149.00 |
| 2026-07 | 216461.80 | 145510.00 | 70951.80 |
| **2026-08** | **72452.00** | **45481.00** | **26971.00** |

(August is the Dashboard “Select Month” example — TOTAL INCOME / EXPENSE / NET BALANCE cards.)

Repeat for several months via the UI summary selector or multiple `?month=` calls. All eight must match.

---

## 3. Verify with the transactions list

1. Open **Transactions**.
2. Set date range `2026-08-01` … `2026-08-31`.
3. Filter Type=Income and Type=Expense separately; sum visible amounts **or** rely on `summary` for the exact total (list is paginated).
4. Confirm row count for August: **21** dated transactions (`source=csv_import`).

---

## 4. Mismatch triage

| Observation | Likely cause | Where to look |
|-------------|--------------|---------------|
| `count` too low / missing category rows | **Import mapping** — unmapped categories never committed; remaps incomplete | Import preview `failed` / `unmappedCategories` |
| `count` OK, amounts off by categories only | **Wrong category remap** targeting wrong type or duplicate | Remap `createCategory` + type match |
| Amounts off across all types, same factor | **Date window / timezone** — month boundary wrong | `summary.dateFrom` / `dateTo`; Excel serial → UTC day |
| Individual rows wrong amount/date | **Parse** of amount/date on that row | Failed rows in preview; `normalizeAmount` / `normalizeDate` |
| List totals differ from `summary` but rows look right | **Aggregation query** bug | `TransactionsRepository.sumByType` vs manual sum |
| Income matches, Expense short, blank-date 700 present | Expected if blank-date row failed import | Not a Dashboard mismatch (Dashboard excludes invalid dates) |

**Rule:** if imported rows (`source=csv_import`, list count) already disagree with the Transactions sheet → import bug first. If list matches sheet row-for-row but `summary` ≠ Dashboard → aggregation bug.

---

## 5. Sign-off checklist

Signed off **2026-08-13** against `Expense_Tracker_Automation Last.xlsx` via `GET /transactions/summary?month=YYYY-MM` (dedicated import household; 336 `csv_import` rows + 1 expected blank-date fail).

- [x] 336+ csv_import transactions present (337 minus blank date)
- [x] `GET /transactions/summary?month=2026-08` matches Dashboard cards
- [x] At least three other months match Monthly Trend table (**all 8 months** Income/Expense match)
- [x] No float noise (compare as fixed 2-decimal strings)

When this passes, Phase 0 exit criterion is met → start Phase 1 (classification, debts, budgets, billing).
