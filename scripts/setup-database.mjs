#!/usr/bin/env node
/**
 * One-time database setup for Subha Fashion Factory.
 *
 * Applies supabase/schema.sql (only if the tables are missing) and then
 * supabase/import-catalog.sql (33 real catalog products) through the
 * Supabase Management API.
 *
 * Requirements in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
 *   SUPABASE_ACCESS_TOKEN=sbp_...   (https://supabase.com/dashboard/account/tokens)
 *
 * Run with:
 *   npm run db:setup
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile() {
  const file = resolve(root, ".env.local");
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) process.env[key] = value;
  }
}

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

async function runQuery(label, query) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const body = await response.text();

  if (!response.ok) {
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.message ?? parsed.error ?? body;
    } catch {
      // keep the raw body
    }
    throw new Error(`${label} failed (${response.status})\n${detail}`);
  }

  return body;
}

function readSql(file) {
  const path = resolve(root, file);
  if (!existsSync(path)) fail(`Missing file: ${file}`);
  return readFileSync(path, "utf8");
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl) {
  fail("NEXT_PUBLIC_SUPABASE_URL is missing from .env.local");
}
if (!accessToken) {
  fail(
    "SUPABASE_ACCESS_TOKEN is missing. Create one at https://supabase.com/dashboard/account/tokens and add it to .env.local"
  );
}

let projectRef;
try {
  projectRef = new URL(supabaseUrl).hostname.split(".")[0];
} catch {
  fail("NEXT_PUBLIC_SUPABASE_URL is not a valid URL");
}

console.log(`\nSubha Fashion Factory — database setup`);
console.log(`Project: ${projectRef}\n`);

try {
  console.log("→ Checking the current schema…");
  const checkBody = await runQuery(
    "Schema check",
    "select to_regclass('public.products') as products;"
  );

  let schemaExists = false;
  try {
    const parsed = JSON.parse(checkBody);
    const row = Array.isArray(parsed) ? parsed[0] : parsed;
    schemaExists = Boolean(row?.products ?? row?.to_regclass);
  } catch {
    schemaExists = false;
  }

  if (schemaExists) {
    console.log("  • Base tables already exist — skipping schema.sql");
  } else {
    console.log("→ Applying supabase/schema.sql…");
    await runQuery("schema.sql", readSql("supabase/schema.sql"));
    console.log("  ✓ Schema created");
  }

  console.log("→ Importing the catalog (supabase/import-catalog.sql)…");
  await runQuery("import-catalog.sql", readSql("supabase/import-catalog.sql"));
  console.log("  ✓ Catalog imported");

  console.log("→ Applying order lifecycle rules (supabase/order-rules.sql)…");
  await runQuery("order-rules.sql", readSql("supabase/order-rules.sql"));
  console.log("  ✓ Order rules applied");

  console.log("→ Applying bill generator tables (supabase/bills.sql)…");
  await runQuery("bills.sql", readSql("supabase/bills.sql"));
  console.log("  ✓ Bill tables and storage bucket ready");

  console.log("→ Verifying…");
  const verifyBody = await runQuery(
    "Verification",
    "select count(*)::int as products from public.products;"
  );
  console.log(`  ${verifyBody}`);

  console.log("\n✓ Database setup complete.\n");
  console.log("Next steps:");
  console.log("  1. Disable email confirmation in Supabase → Authentication → Providers → Email.");
  console.log("  2. Register the admin account in the app.");
  console.log("  3. Promote it in the SQL Editor:");
  console.log("     update public.profiles set role = 'admin' where email = 'you@example.com';");
  console.log("  4. Add product photos from Admin → Products.\n");
} catch (error) {
  console.error(`\n✗ ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
}
