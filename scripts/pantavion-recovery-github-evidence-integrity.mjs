import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const ROOT = process.cwd();
const MANIFEST_DIR = path.join(ROOT, "docs/recovery/live/github");
const MANIFEST_PATTERN = /^thread-8-durability-manifest-.*\.json$/;
const SHA1_PATTERN = /^[0-9a-f]{40}$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function currentGitBlobSha(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  const body = await readFile(absolutePath);
  const header = Buffer.from(`blob ${body.byteLength}\0`, "utf8");
  return createHash("sha1").update(header).update(body).digest("hex");
}

async function historicalBlobExists(blobSha) {
  assert(SHA1_PATTERN.test(blobSha), `invalid_git_blob_sha:${blobSha}`);
  try {
    const { stdout } = await execFile("git", ["cat-file", "-t", blobSha], { cwd: ROOT });
    return stdout.trim() === "blob";
  } catch {
    return false;
  }
}

function collectLocalEvidencePointers(manifest) {
  const pointers = [];
  const transition = manifest.protocolTransitionReceipt ?? {};
  for (const [name, value] of Object.entries(transition)) {
    if (value && typeof value === "object" && typeof value.path === "string" && typeof value.gitBlobSha === "string") {
      pointers.push({ category: "protocolTransitionReceipt", name, ...value });
    }
  }

  const locks = manifest.threadOwnershipReceipt?.locks ?? [];
  for (const lock of locks) {
    pointers.push({ category: "threadOwnershipReceipt", name: `thread-${lock.thread}`, ...lock });
  }
  return pointers;
}

async function verifyManifest(manifestPath) {
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);

  assert(manifest.schema === "pantavion_github_durability_manifest_v1", "unexpected_manifest_schema");
  assert(manifest.protocol === "PANTAVION_10_THREAD_PARALLEL_ABSORPTION_20260915", "unexpected_protocol");
  assert(manifest.thread === 8, "manifest_not_owned_by_thread_8");
  assert(manifest.role === "GITHUB_EVIDENCE_DURABILITY", "unexpected_thread_8_role");
  assert(manifest.recoveryBranch === "backup/pre-vercel-risk-20260914", "unexpected_recovery_branch");

  const safety = manifest.safety ?? {};
  assert(safety.zeroDeletions === true, "zero_deletions_not_bound");
  assert(safety.zeroDestructiveVercelMutations === true, "destructive_vercel_mutations_not_prohibited");
  assert(safety.secretValuesRecorded === false, "secret_values_must_not_be_recorded");
  assert(safety.rawPayloadsDuplicatedIntoGitHub === false, "raw_payload_duplication_must_remain_false");
  assert(safety.githubUsedAsHighThroughputPrimaryDatabase === false, "github_must_not_be_primary_high_throughput_database");

  const locks = manifest.threadOwnershipReceipt?.locks ?? [];
  const threadIds = locks.map((lock) => lock.thread).sort((a, b) => a - b);
  assert(locks.length === 10, `expected_10_thread_locks_found_${locks.length}`);
  assert(new Set(threadIds).size === 10, "duplicate_thread_lock_receipt");
  assert(threadIds.every((thread, index) => thread === index), "thread_lock_receipts_must_cover_0_through_9_exactly");
  assert(manifest.threadOwnershipReceipt?.allThreads0Through9HaveDurableLocks === true, "all_threads_lock_claim_not_bound");

  const pointers = collectLocalEvidencePointers(manifest);
  const pointerPaths = pointers.map((pointer) => pointer.path);
  assert(new Set(pointerPaths).size === pointerPaths.length, "duplicate_local_evidence_pointer_path");

  const verifiedPointers = [];
  let currentPathMatches = 0;
  let currentPathAdvanced = 0;
  for (const pointer of pointers) {
    const blobPreserved = await historicalBlobExists(pointer.gitBlobSha);
    assert(blobPreserved, `historical_blob_missing:${pointer.path}:${pointer.gitBlobSha}`);

    let currentSha = null;
    try {
      currentSha = await currentGitBlobSha(pointer.path);
    } catch {
      currentSha = null;
    }

    const currentMatchesPointer = currentSha === pointer.gitBlobSha;
    if (currentMatchesPointer) currentPathMatches += 1;
    else currentPathAdvanced += 1;

    verifiedPointers.push({
      path: pointer.path,
      preservedGitBlobSha: pointer.gitBlobSha,
      historicalBlobPreserved: true,
      currentGitBlobSha: currentSha,
      currentMatchesPointer,
    });
  }

  const production = manifest.productionEvidencePointers ?? {};
  assert(typeof production.projectId === "string" && production.projectId.startsWith("prj_"), "invalid_project_id_pointer");
  assert(
    typeof production.deploymentIdentity === "string" && production.deploymentIdentity.startsWith(`${production.projectId}:dpl_`),
    "deployment_identity_must_use_projectId_deploymentId"
  );
  assert(production.deploymentState !== "VERIFIED_LIVE", "ready_deployment_must_not_be_relabelled_verified_live");
  assert(
    production.founderRecoveryBoundary?.authenticatedFounderFeedVerified !== true || production.founderRecoveryBoundary?.httpStatus === 200,
    "authenticated_founder_feed_cannot_be_verified_without_live_http_boundary"
  );

  const worker = manifest.workerExecutionEvidence ?? {};
  const statusTotal = ["planned", "queued", "running", "succeeded", "failed"]
    .map((key) => Number(worker[key] ?? 0))
    .reduce((sum, value) => sum + value, 0);
  assert(Number(worker.total) === statusTotal, `worker_status_total_mismatch:${worker.total}:${statusTotal}`);
  assert(Number(worker.leased ?? 0) >= 0, "invalid_leased_count");
  assert(Number(worker.maxAttempt ?? 0) >= 0, "invalid_max_attempt");

  const completion = manifest.completion ?? {};
  const noExecutionProof =
    Number(worker.running ?? 0) === 0 &&
    Number(worker.succeeded ?? 0) === 0 &&
    Number(worker.failed ?? 0) === 0 &&
    Number(worker.leased ?? 0) === 0 &&
    Number(worker.maxAttempt ?? 0) === 0;
  if (noExecutionProof) {
    assert(completion.workerExecutionEvidenceBound === false, "worker_execution_cannot_be_bound_without_fenced_execution_evidence");
  }
  if (completion.finalConvergenceVerified !== true) {
    assert(completion.state !== "COMPLETE" && completion.state !== "VERIFIED_LIVE", "intermediate_state_must_not_be_marked_complete");
  }

  assert(manifest.countIntegrity?.datasetsComparable === false, "vercel_estimate_and_pantavion_corpus_must_not_be_marked_comparable");

  return {
    ok: true,
    manifest: path.relative(ROOT, manifestPath),
    verifiedHistoricalEvidencePointers: verifiedPointers.length,
    currentPathMatches,
    currentPathAdvanced,
    verifiedThreads: threadIds,
    deploymentIdentity: production.deploymentIdentity,
    worker: {
      total: Number(worker.total),
      planned: Number(worker.planned ?? 0),
      queued: Number(worker.queued ?? 0),
      running: Number(worker.running ?? 0),
      succeeded: Number(worker.succeeded ?? 0),
      failed: Number(worker.failed ?? 0),
      leased: Number(worker.leased ?? 0),
      maxAttempt: Number(worker.maxAttempt ?? 0),
    },
    completionState: completion.state,
    evidencePointers: verifiedPointers,
  };
}

async function main() {
  const names = (await readdir(MANIFEST_DIR)).filter((name) => MANIFEST_PATTERN.test(name)).sort();
  assert(names.length > 0, "no_thread_8_durability_manifest_found");

  const results = [];
  for (const name of names) {
    results.push(await verifyManifest(path.join(MANIFEST_DIR, name)));
  }

  process.stdout.write(`${JSON.stringify({ ok: true, manifestsVerified: results.length, results }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2)}\n`);
  process.exitCode = 1;
});
