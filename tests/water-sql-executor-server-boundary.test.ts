import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function run() {
  const source = await readFile(
    new URL("../core/infrastructure/water/water-sql-executor.server.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /import "server-only"/);
  assert.match(source, /createWaterSqlExecutor/);
  assert.match(source, /=> null/);
  assert.doesNotMatch(source, /DATABASE_URL|PGPASSWORD|postgres:\/\//i);
  assert.doesNotMatch(source, /render\.com|supabase\.co|vercel\.com/i);

  console.log("water-sql-executor-server-boundary: ok");
}

run();
