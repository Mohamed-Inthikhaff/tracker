/**
 * Dev-only clean slate: delete csv_import transactions for one household.
 *
 * NOT the FR-IMP-006 product feature. Proper "undo this import" needs an
 * import_batch_id on transactions (missing today — only source=csv_import).
 *
 * Usage (from repo root):
 *   node apps/api/scripts/cleanup-csv-imports.mjs --household <uuid>
 *   node apps/api/scripts/cleanup-csv-imports.mjs --household <uuid> --confirm
 *   node apps/api/scripts/cleanup-csv-imports.mjs --household <uuid> --confirm --batches
 *
 * Without --confirm: dry-run counts only.
 * With --batches: also delete import_batches rows for that household.
 */
import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), "apps/api/.env"));

const require = createRequire(resolve(process.cwd(), "apps/api/package.json"));
const { Client } = require("pg");

const args = parseArgs(process.argv.slice(2));
const householdId = args.household;
const confirm = Boolean(args.confirm);
const wipeBatches = Boolean(args.batches);

if (!householdId || !/^[0-9a-f-]{36}$/i.test(householdId)) {
  console.error(
    "Usage: node apps/api/scripts/cleanup-csv-imports.mjs --household <uuid> [--confirm] [--batches]"
  );
  process.exit(1);
}

const client = new Client({
  host: required("DB_HOST"),
  port: Number(process.env.DB_PORT || 5432),
  user: required("DB_USER"),
  password: required("DB_PASSWORD"),
  database: required("DB_NAME"),
  ssl:
    process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
try {
  const count = await client.query(
    `SELECT COUNT(*)::int AS n
     FROM transactions
     WHERE household_id = $1 AND source = 'csv_import'`,
    [householdId]
  );
  const batches = await client.query(
    `SELECT COUNT(*)::int AS n FROM import_batches WHERE household_id = $1`,
    [householdId]
  );
  const manual = await client.query(
    `SELECT COUNT(*)::int AS n
     FROM transactions
     WHERE household_id = $1 AND source <> 'csv_import'`,
    [householdId]
  );

  console.log({
    householdId,
    csvImportTransactions: count.rows[0].n,
    otherSourceTransactions: manual.rows[0].n,
    importBatches: batches.rows[0].n,
    mode: confirm ? "DELETE" : "dry-run",
    wipeBatches,
  });

  if (!confirm) {
    console.log("Dry-run only. Re-run with --confirm to delete.");
    process.exit(0);
  }

  await client.query("BEGIN");
  const deleted = await client.query(
    `DELETE FROM transactions
     WHERE household_id = $1 AND source = 'csv_import'
     RETURNING id`,
    [householdId]
  );
  let batchesDeleted = 0;
  if (wipeBatches) {
    const b = await client.query(
      `DELETE FROM import_batches WHERE household_id = $1 RETURNING id`,
      [householdId]
    );
    batchesDeleted = b.rowCount ?? 0;
  }
  await client.query("COMMIT");

  console.log({
    deletedTransactions: deleted.rowCount ?? 0,
    deletedBatches: batchesDeleted,
  });
  console.log(
    "Done. Debt/budget/dashboard numbers recompute live on next read — no extra cleanup."
  );
} catch (err) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error(err);
  process.exit(1);
} finally {
  await client.end();
}

function required(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env ${key}`);
  return v;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--confirm" || a === "--batches") {
      out[a.slice(2)] = true;
      continue;
    }
    if (a.startsWith("--") && i + 1 < argv.length) {
      out[a.slice(2)] = argv[++i];
    }
  }
  return out;
}

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2];
    }
  }
}
