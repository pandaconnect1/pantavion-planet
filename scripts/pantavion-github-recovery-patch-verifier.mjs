import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

const BRIDGE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-github-recovery-patch-verifier-bridge";
const OIDC_AUDIENCE = "pantavion-supabase-patch-verifier";
const MAX_TASKS = Math.max(1, Math.min(3, Number(process.env.PANTAVION_PATCH_VERIFIER_MAX_TASKS ?? 3)));
const SAFE_PATH = /^(?:[a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+$/;
const SHA40 = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
let cachedToken = null;
let cachedExpiryMs = 0;

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_environment:${name}`);
  return value;
}

function decodeExpiry(token) {
  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return Number(JSON.parse(Buffer.from(padded, "base64").toString("utf8")).exp ?? 0) * 1000;
  } catch { return 0; }
}

async function oidcToken(force = false) {
  const now = Date.now();
  if (!force && cachedToken && cachedExpiryMs - now > 60_000) return cachedToken;
  const url = new URL(requireEnv("ACTIONS_ID_TOKEN_REQUEST_URL"));
  url.searchParams.set("audience", OIDC_AUDIENCE);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${requireEnv("ACTIONS_ID_TOKEN_REQUEST_TOKEN")}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.value !== "string" || !body.value) throw new Error(`github_oidc_token_request_failed:${response.status}`);
  cachedToken = body.value;
  cachedExpiryMs = decodeExpiry(body.value);
  return cachedToken;
}

async function bridge(payload, retry401 = true) {
  const response = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${await oidcToken(false)}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (response.status === 401 && retry401) {
    await oidcToken(true);
    return bridge(payload, false);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok !== true) throw new Error(`patch_verifier_bridge_failed:${payload.action}:${body.code ?? response.status}`);
  return body;
}

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options });
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function validateInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("verifier_input_missing");
  const repositoryBaseSha = String(input.repositoryBaseSha ?? "");
  const repositoryFile = String(input.repositoryFile ?? "");
  const sourceSha256 = String(input.sourceSha256 ?? "");
  const unifiedDiff = String(input.unifiedDiff ?? "");
  if (!SHA40.test(repositoryBaseSha)) throw new Error("verifier_base_sha_invalid");
  if (!SAFE_PATH.test(repositoryFile)) throw new Error("verifier_repository_file_invalid");
  if (!SHA256.test(sourceSha256)) throw new Error("verifier_source_sha_invalid");
  if (!unifiedDiff || unifiedDiff.length > 30000) throw new Error("verifier_diff_invalid");
  if (!unifiedDiff.startsWith(`--- a/${repositoryFile}\n+++ b/${repositoryFile}\n`)) throw new Error("verifier_diff_scope_invalid");
  return { repositoryBaseSha, repositoryFile, sourceSha256, unifiedDiff };
}

async function finishFailure(claim, error) {
  try {
    await bridge({
      action: "finish",
      executionId: claim.executionId,
      ownerId: claim.ownerId,
      fencingToken: claim.fencingToken,
      succeeded: false,
      error: String(error instanceof Error ? error.message : error).slice(0, 500),
    });
  } catch (finishError) {
    console.error("patch_verifier_finish_failure_rejected", { executionId: claim.executionId, error: String(finishError) });
  }
}

async function verifyOne(claim) {
  const input = validateInput(claim.input);
  const patchPath = `/tmp/pantavion-${claim.executionId.replace(/[^a-zA-Z0-9_-]/g, "_")}.patch`;
  try {
    run("git", ["reset", "--hard", input.repositoryBaseSha]);
    run("git", ["clean", "-fd"]);
    const source = readFileSync(input.repositoryFile, "utf8");
    const actualSourceSha = sha256(source);
    if (actualSourceSha !== input.sourceSha256) throw new Error(`source_hash_mismatch:${actualSourceSha}`);

    writeFileSync(patchPath, input.unifiedDiff, "utf8");
    run("git", ["apply", "--check", "--whitespace=error-all", patchPath]);
    run("git", ["apply", "--whitespace=error-all", patchPath]);
    run("git", ["diff", "--check"]);

    await bridge({ action: "heartbeat", executionId: claim.executionId, ownerId: claim.ownerId, fencingToken: claim.fencingToken });
    run("npm", ["run", "typecheck"], { timeout: 8 * 60 * 1000 });

    const diffStat = run("git", ["diff", "--stat", "--", input.repositoryFile]).trim().slice(0, 1000);
    const output = {
      marker: "pantavion_recovery_patch_verifier_output_v1",
      parentBuilderFileExecutionId: claim.input.parentBuilderFileExecutionId ?? null,
      repositoryBaseSha: input.repositoryBaseSha,
      repositoryFile: input.repositoryFile,
      sourceSha256: input.sourceSha256,
      sourceHashVerified: true,
      gitApplyCheck: true,
      diffCheck: true,
      typecheckPassed: true,
      diffStat,
      authority: { mainBranchWrite:false, merge:false, deployment:false, productionWrite:false, publicRelease:false },
      checkedAt: new Date().toISOString(),
      completionTruth: "PATCH_APPLIED_IN_ISOLATED_CHECKOUT_TYPECHECKED_NOT_LIVE",
    };
    await bridge({
      action: "finish",
      executionId: claim.executionId,
      ownerId: claim.ownerId,
      fencingToken: claim.fencingToken,
      succeeded: true,
      output,
    });
    console.log(JSON.stringify({ marker:"pantavion_patch_verified_v1", executionId:claim.executionId, repositoryFile:input.repositoryFile, diffStat }));
    return true;
  } catch (error) {
    await finishFailure(claim, error);
    console.error(JSON.stringify({ marker:"pantavion_patch_verification_failed_v1", executionId:claim.executionId, error:String(error instanceof Error ? error.message : error).slice(0,500) }));
    return false;
  } finally {
    try { unlinkSync(patchPath); } catch {}
    try { run("git", ["reset", "--hard", input.repositoryBaseSha]); } catch {}
  }
}

const runId = requireEnv("GITHUB_RUN_ID");
const runAttempt = requireEnv("GITHUB_RUN_ATTEMPT");
let attempted = 0;
let succeeded = 0;
let failed = 0;

for (let index = 0; index < MAX_TASKS; index += 1) {
  const ownerId = `github-patch-verifier:${runId}:${runAttempt}:${index}`;
  const claim = await bridge({ action: "claim", ownerId });
  if (claim.acquired !== true) break;
  attempted += 1;
  if (await verifyOne(claim)) succeeded += 1; else failed += 1;
}

const status = await bridge({ action: "status" });
console.log(JSON.stringify({ marker:"pantavion_patch_verifier_run_v1", attempted, succeeded, failed, queue:status }));
if (failed > 0) process.exitCode = 1;
