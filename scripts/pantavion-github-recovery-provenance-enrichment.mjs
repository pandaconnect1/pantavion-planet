import fs from "node:fs";
import readline from "node:readline";

import {
  PANTAVION_RECOVERY_CORPUS_CONTRACT,
  digestPantavionRecoverySourceRecord,
} from "../core/recovery/pantavion-recovery-runtime-fabric.ts";

const BRIDGE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-github-recovery-provenance-bridge";
const OIDC_AUDIENCE = "pantavion-supabase-recovery";
const SEMANTIC_LEDGER_PATH = PANTAVION_RECOVERY_CORPUS_CONTRACT.semanticLedgerPath;
const WORK_UNITS_PATH = "data/recovery/runtime-fabric-v1/recovery-work-units.ndjson";
const EXPECTED_RECORDS = PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount;
const CHUNK_SIZE = 100;
const MAX_RETRIES = 5;
const SHA256_RE = /^[0-9a-f]{64}$/;

let cachedOidcToken = null;
let cachedOidcExpiryMs = 0;

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_environment:${name}`);
  return value;
}

function decodeJwtExpiryMs(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return 0;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return Number(JSON.parse(Buffer.from(padded, "base64").toString("utf8")).exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

async function getOidcToken(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedOidcToken && cachedOidcExpiryMs - now > 60_000) return cachedOidcToken;
  const requestUrl = new URL(requireEnv("ACTIONS_ID_TOKEN_REQUEST_URL"));
  requestUrl.searchParams.set("audience", OIDC_AUDIENCE);
  const response = await fetch(requestUrl, {
    headers: { Authorization: `Bearer ${requireEnv("ACTIONS_ID_TOKEN_REQUEST_TOKEN")}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.value !== "string" || !body.value) {
    throw new Error(`github_oidc_token_request_failed:${response.status}`);
  }
  cachedOidcToken = body.value;
  cachedOidcExpiryMs = decodeJwtExpiryMs(body.value);
  return cachedOidcToken;
}

async function invokeBridge(payload, allowRefresh = true) {
  const token = await getOidcToken(false);
  const response = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (response.status === 401 && allowRefresh) {
    await getOidcToken(true);
    return invokeBridge(payload, false);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok !== true) {
    const code = typeof body.code === "string" ? body.code : `http_${response.status}`;
    throw new Error(`recovery_provenance_bridge_call_failed:${payload.action}:${code}`);
  }
  return body;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function invokeBridgeWithRetry(payload) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await invokeBridge(payload);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) break;
      await sleep(Math.min(8_000, 350 * (2 ** (attempt - 1))));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError ?? "bridge_retry_exhausted"));
}

async function* jsonLines(filePath) {
  const input = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  try {
    for await (const line of input) {
      if (!line.trim()) continue;
      yield JSON.parse(line);
    }
  } finally {
    input.close();
  }
}

function optionalText(value, maxLength) {
  if (value == null) return null;
  if (typeof value !== "string") throw new Error("repository_provenance_text_invalid");
  const clean = value.trim();
  if (!clean) return null;
  if (clean.length > maxLength || clean.includes("\u0000")) {
    throw new Error("repository_provenance_text_out_of_bounds");
  }
  return clean;
}

function optionalSourceLine(value) {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1) {
    throw new Error(`repository_source_line_invalid:${String(value)}`);
  }
  return numeric;
}

async function flush(rows) {
  if (rows.length === 0) return 0;
  const response = await invokeBridgeWithRetry({
    action: "enrich_provenance",
    rows,
  });
  const report = response.report;
  if (
    response.capability !== "recovery_catalog_provenance_enrichment" ||
    !report ||
    report.ok !== true ||
    report.marker !== "pantavion_recovery_catalog_provenance_enrichment_v1" ||
    Number(report.requested) !== rows.length ||
    Number(report.updated) !== rows.length ||
    report.rawPayloadStored !== false
  ) {
    throw new Error("recovery_provenance_enrichment_invalid_response");
  }
  return rows.length;
}

const semanticIterator = jsonLines(SEMANTIC_LEDGER_PATH)[Symbol.asyncIterator]();
const workUnitIterator = jsonLines(WORK_UNITS_PATH)[Symbol.asyncIterator]();
const pending = [];
let total = 0;
let enriched = 0;
let withRepositorySourceFile = 0;
let withRepositorySourceLine = 0;
let withSourceFamily = 0;
let expectedOrdinal = 1;

while (true) {
  const [semanticNext, workUnitNext] = await Promise.all([
    semanticIterator.next(),
    workUnitIterator.next(),
  ]);

  if (semanticNext.done || workUnitNext.done) {
    if (semanticNext.done !== workUnitNext.done) {
      throw new Error("semantic_work_unit_length_mismatch");
    }
    break;
  }

  const semantic = semanticNext.value;
  const workUnit = workUnitNext.value;
  if (!semantic || typeof semantic !== "object" || Array.isArray(semantic)) {
    throw new Error(`semantic_record_invalid:${expectedOrdinal}`);
  }
  if (!workUnit || typeof workUnit !== "object" || Array.isArray(workUnit)) {
    throw new Error(`work_unit_invalid:${expectedOrdinal}`);
  }
  if (semantic.id !== workUnit.recordId) {
    throw new Error(`semantic_work_unit_record_id_mismatch:${expectedOrdinal}`);
  }
  if (workUnit?.source?.globalOrdinal !== expectedOrdinal) {
    throw new Error(`work_unit_global_ordinal_mismatch:${expectedOrdinal}`);
  }

  const semanticSha = digestPantavionRecoverySourceRecord(semantic);
  if (!SHA256_RE.test(semanticSha) || workUnit?.source?.semanticRecordSha256 !== semanticSha) {
    throw new Error(`semantic_record_sha_mismatch:${expectedOrdinal}`);
  }

  const provenance = semantic.provenance && typeof semantic.provenance === "object" && !Array.isArray(semantic.provenance)
    ? semantic.provenance
    : {};
  const repositorySourceFile = optionalText(provenance.sourceFile, 1000);
  const repositorySourceLine = optionalSourceLine(provenance.sourceLine);
  const sourceFamily = optionalText(provenance.sourceFamily, 200);

  if (repositorySourceFile) withRepositorySourceFile += 1;
  if (repositorySourceLine) withRepositorySourceLine += 1;
  if (sourceFamily) withSourceFamily += 1;

  pending.push({
    recordId: semantic.id,
    semanticRecordSha256: semanticSha,
    repositorySourceFile,
    repositorySourceLine,
    sourceFamily,
  });
  total += 1;
  expectedOrdinal += 1;

  if (pending.length >= CHUNK_SIZE) {
    enriched += await flush(pending.splice(0, pending.length));
  }
}

if (pending.length > 0) enriched += await flush(pending.splice(0, pending.length));

if (total !== EXPECTED_RECORDS || enriched !== EXPECTED_RECORDS) {
  throw new Error(`recovery_provenance_total_mismatch:${total}:${enriched}:${EXPECTED_RECORDS}`);
}

const status = await invokeBridge({ action: "status" });
if (
  status.capability !== "recovery_catalog_provenance_status" ||
  Number(status.totalRecords) !== EXPECTED_RECORDS ||
  Number(status.expectedRecords) !== EXPECTED_RECORDS ||
  Number(status.withRepositorySourceFile) !== withRepositorySourceFile ||
  Number(status.withRepositorySourceLine) !== withRepositorySourceLine ||
  Number(status.withSourceFamily) !== withSourceFamily ||
  status.rawPayloadStored !== false
) {
  throw new Error("recovery_provenance_status_mismatch");
}

console.log(JSON.stringify({
  marker: "pantavion_recovery_repository_provenance_enrichment_v1",
  recordsVerified: total,
  recordsEnriched: enriched,
  withRepositorySourceFile,
  withRepositorySourceLine,
  withSourceFamily,
  semanticSource: SEMANTIC_LEDGER_PATH,
  workUnitSource: WORK_UNITS_PATH,
  rawPayloadStored: false,
  status,
}, null, 2));
