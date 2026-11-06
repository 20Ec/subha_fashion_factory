#!/usr/bin/env node
/**
 * Applies a SQL file to the Supabase project through the Management API.
 *
 * Usage:
 *   node scripts/apply-sql.mjs supabase/order-rules.sql
 *   npm run db:migrate
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN in .env.local.
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

loadEnvFile();

const file = process.argv[2] ?? "supabase/order-rules.sql";
const path = resolve(root, file);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!existsSync(path)) {
  console.error(`\n✗ Missing SQL file: ${file}\n`);
  process.exit(1);
}

if (!supabaseUrl) {
  console.error("\n✗ NEXT_PUBLIC_SUPABASE_URL is missing from .env.local\n");
  process.exit(1);
}

if (!accessToken) {
  console.error(
    "\n✗ SUPABASE_ACCESS_TOKEN is missing. Add it to .env.local to run migrations.\n"
  );
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const query = readFileSync(path, "utf8");

console.log(`\nApplying ${file} to ${projectRef}…`);

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
  console.error(`\n✗ ${file} failed (${response.status})\n${detail}\n`);
  process.exit(1);
}

if (body.trim() && body.trim() !== "[]") {
  console.log(body);
}

console.log(`\n✓ ${file} applied.\n`);
