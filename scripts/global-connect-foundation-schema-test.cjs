#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const migrationPath = path.join(
  ROOT,
  "supabase/migrations/20260815010000_create_global_connect_foundation.sql",
);
const rollbackPath = path.join(
  ROOT,
  "supabase/rollback/20260815010000_create_global_connect_foundation.down.sql",
);

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required file: ${path.relative(ROOT, file)}`);
  }

  return fs.readFileSync(file, "utf8");
}

function requireText(text, marker) {
  if (!text.includes(marker)) {
    throw new Error(`Missing migration marker: ${marker}`);
  }
}

const migration = read(migrationPath);
const rollback = read(rollbackPath);

const tables = [
  "global_connect_handles",
  "global_connect_passkey_credentials",
  "global_connect_auth_challenges",
  "global_connect_recovery_codes",
  "global_connect_devices",
  "global_connect_sessions",
  "global_connect_country_registry",
  "global_connect_translation_channels",
  "global_connect_translation_lanes",
  "global_connect_translation_jobs",
  "global_connect_translation_outputs",
  "global_connect_command_receipts",
  "global_connect_outbox_events",
  "global_connect_audit_references",
];

for (const table of tables) {
  requireText(migration, `create table if not exists public.${table}`);
  requireText(migration, `alter table public.${table} enable row level security;`);
  requireText(migration, `revoke all on public.${table} from anon, authenticated;`);
  requireText(rollback, `drop table if exists public.${table};`);
}

for (const marker of [
  "challenge_hash text not null unique",
  "code_hash text not null unique",
  "refresh_secret_hash text not null unique",
  "idempotency_key text not null unique",
  "immutable_original boolean not null default true check (immutable_original)",
  "global_connect_translation_original_is_immutable",
  "global_connect_audit_references_are_immutable",
  "data_boundary <> 'private_chat' or source_conversation_id is not null",
]) {
  requireText(migration, marker);
}

for (const forbiddenColumn of ["session_token", "refresh_token", "recovery_code text", "challenge text not null"]) {
  if (migration.includes(forbiddenColumn)) {
    throw new Error(`Forbidden raw-secret column marker found: ${forbiddenColumn}`);
  }
}

const countrySeedMatch = migration.match(
  /insert into public\.global_connect_country_registry\s*\([\s\S]*?\)\s*values\s*([\s\S]*?)\s*on conflict \(iso_alpha2\) do nothing;/i,
);
if (!countrySeedMatch) {
  throw new Error("Missing global_connect_country_registry seed block.");
}

const seededCountryCodes = [...countrySeedMatch[1].matchAll(/^\s*\('([A-Z]{2})'/gm)].map((match) => match[1]);
if (seededCountryCodes.length !== 249 || new Set(seededCountryCodes).size !== 249) {
  throw new Error(`Country seed must contain exactly 249 unique ISO alpha-2 codes; found ${seededCountryCodes.length}.`);
}

if (!countrySeedMatch[1].includes("'registry-only'")) {
  throw new Error("Country seed must start with honest registry-only statuses.");
}

console.log("PASS: Global Connect migration static contract checks (not a live database migration).");
