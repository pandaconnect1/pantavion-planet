import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const ROOT = process.cwd();
const EVIDENCE_DIR = path.join(ROOT, "docs/recovery/live/github");
const MANIFEST_PATTERN = /^thread-8-durability-manifest-.*\.json$/;
const RECEIPT_PATTERN = /^thread-8-parallel-output-receipt-.*\.json$/;
const SHA1_PATTERN = /^[0-9a-f]{40}$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSha1(value, label) {
  assert(typeof value === "string" && SHA1_PATTERN.test(value), `invalid_${label}:${value}`);
}

async function currentGitBlobSha(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  const body = await readFile(absolutePath);
  const header = Buffer.from(`blob ${body.byteLength}\0`, "utf8");
  return createHash("sha1").update(header).update(body).digest("hex");
}

async function gitObjectType(objectSha) {
  assertSha1(objectSha, "git_object_sha");
  try {
    const { stdout } = await execFile("git", ["cat-file", "-t", objectSha], { cwd: ROOT });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function assertGitObject(objectSha, expectedType, label) {
  const actualType = await gitObjectType(objectSha);
  assert(actualType === expectedType, `${label}_missing_or_wrong_type:${objectSha}:expected=${expectedType}:actual=${actualType}`);
}

async function commitTreeSha(commitSha) {
  assertSha1(commitSha, "commit_sha");
  const { stdout } = await execFile("git", ["show", "-s", "--format=%T", commitSha], { cwd: ROOT });
  return stdout.trim();
}

async function verifyBlobPointer(pointer) {
  assert(pointer && typeof pointer.path === "string" && pointer.path.length > 0, "invalid_blob_pointer_path");
  assertSha1(pointer.gitBlobSha, "blob_sha");
  await assertGitObject(pointer.gitBlobSha, "blob", `historical_blob:${pointer.path}`);

  let currentSha = null;
  try {
    currentSha = await currentGitBlobSha(pointer.path);
  } catch {
    currentSha = null;
  }

  return {
    path: pointer.path,
    preservedGitBlobSha: pointer.gitBlobSha,
    historicalBlobPreserved: true,
    currentGitBlobSha: currentSha,
    currentMatchesPointer: currentSha === pointer.gitBlobSha,
  };
}

function collectManifestBlobPointers(manifest) {
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

function verifyCommonThread8Safety(safety) {
  assert(safety?.zeroDeletions === true, "zero_deletions_not_bound");
  assert(safety?.zeroDestructiveVercelMutations === true, "destructive_vercel_mutations_not_prohibited");
  if (Object.hasOwn(safety ?? {}, "secretValuesRecorded")) {
    assert(safety.secretValuesRecorded === false, "secret_values_must_not_be_recorded");
  }
  if (Object.hasOwn(safety ?? {}, "secretsRecorded")) {
    assert(safety.secretsRecorded === false, "secrets_must_not_be_recorded");
  }
  if (Object.hasOwn(safety ?? {}, "rawPayloadsDuplicatedIntoGitHub")) {
    assert(safety.rawPayloadsDuplicatedIntoGitHub === false, "raw_payload_duplication_must_remain_false");
  }
  if (Object.hasOwn(safety ?? {}, "rawPayloadsDuplicated")) {
    assert(safety.rawPayloadsDuplicated === false, "raw_payload_duplication_must_remain_false");
  }
  if (Object.hasOwn(safety ?? {}, "githubUsedAsHighThroughputPrimaryDatabase")) {
    assert(safety.githubUsedAsHighThroughputPrimaryDatabase === false, "github_must_not_be_primary_high_throughput_database");
  }
  if (Object.hasOwn(safety ?? {}, "foreignThreadArtifactsMutated")) {
    assert(safety.foreignThreadArtifactsMutated === false, "thread8_must_not_mutate_foreign_thread_artifacts");
  }
}

function workerStatusTotal(worker) {
  return ["planned", "queued", "running", "succeeded", "failed"]
    .map((key) => Number(worker?.[key] ?? 0))
    .reduce((sum, value) => sum + value, 0);
}

async function verifyDurabilityManifest(manifestPath) {
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);

  assert(manifest.schema === "pantavion_github_durability_manifest_v1", "unexpected_manifest_schema");
  assert(manifest.protocol === "PANTAVION_10_THREAD_PARALLEL_ABSORPTION_20260915", "unexpected_protocol");
  assert(manifest.thread === 8, "manifest_not_owned_by_thread_8");
  assert(manifest.role === "GITHUB_EVIDENCE_DURABILITY", "unexpected_thread_8_role");
  assert(manifest.recoveryBranch === "backup/pre-vercel-risk-20260914", "unexpected_recovery_branch");
  verifyCommonThread8Safety(manifest.safety);

  const locks = manifest.threadOwnershipReceipt?.locks ?? [];
  const threadIds = locks.map((lock) => lock.thread).sort((a, b) => a - b);
  assert(locks.length === 10, `expected_10_thread_locks_found_${locks.length}`);
  assert(new Set(threadIds).size === 10, "duplicate_thread_lock_receipt");
  assert(threadIds.every((thread, index) => thread === index), "thread_lock_receipts_must_cover_0_through_9_exactly");
  assert(manifest.threadOwnershipReceipt?.allThreads0Through9HaveDurableLocks === true, "all_threads_lock_claim_not_bound");

  const pointers = collectManifestBlobPointers(manifest);
  const pointerPaths = pointers.map((pointer) => pointer.path);
  assert(new Set(pointerPaths).size === pointerPaths.length, "duplicate_local_evidence_pointer_path");

  const verifiedPointers = [];
  for (const pointer of pointers) verifiedPointers.push(await verifyBlobPointer(pointer));

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
  assert(Number(worker.total) === workerStatusTotal(worker), `worker_status_total_mismatch:${worker.total}:${workerStatusTotal(worker)}`);
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
    kind: "durability_manifest",
    ok: true,
    evidenceFile: path.relative(ROOT, manifestPath),
    verifiedHistoricalEvidencePointers: verifiedPointers.length,
    currentPathMatches: verifiedPointers.filter((pointer) => pointer.currentMatchesPointer).length,
    currentPathAdvanced: verifiedPointers.filter((pointer) => !pointer.currentMatchesPointer).length,
    verifiedThreads: threadIds,
    deploymentIdentity: production.deploymentIdentity,
    completionState: completion.state,
  };
}

async function verifyParallelOutputReceipt(receiptPath) {
  const raw = await readFile(receiptPath, "utf8");
  const receipt = JSON.parse(raw);

  assert(receipt.schema === "pantavion_thread8_parallel_output_receipt_v1", "unexpected_parallel_receipt_schema");
  assert(receipt.protocol === "PANTAVION_10_THREAD_PARALLEL_ABSORPTION_20260915", "unexpected_parallel_receipt_protocol");
  assert(receipt.thread === 8, "parallel_receipt_not_owned_by_thread_8");
  assert(receipt.scope === "GITHUB_EVIDENCE_DURABILITY", "unexpected_parallel_receipt_scope");
  assert(receipt.recoveryBranch === "backup/pre-vercel-risk-20260914", "unexpected_parallel_receipt_branch");
  verifyCommonThread8Safety(receipt.safety);

  assert(receipt.truthRules?.activityEvidenceIsNotCompletion === true, "activity_must_not_equal_completion");
  assert(receipt.truthRules?.commitMessageAloneDoesNotRaiseCounts === true, "commit_message_must_not_raise_counts");
  assert(receipt.truthRules?.readyOrDeployedIsNotVerifiedLive === true, "ready_must_not_equal_verified_live");
  assert(receipt.truthRules?.preflightIsNotRouted === true, "preflight_must_not_equal_routed");
  assert(receipt.truthRules?.routerCodePresentIsNotRouterExecution === true, "router_code_must_not_equal_execution");
  assert(receipt.truthRules?.blockedIsNotComplete === true, "blocked_must_not_equal_complete");
  assert(receipt.truthRules?.noDatasetConflation === true, "datasets_must_not_be_conflated");

  const head = receipt.branchHeadObserved ?? {};
  await assertGitObject(head.commitSha, "commit", "branch_head_commit");
  await assertGitObject(head.treeSha, "tree", "branch_head_tree");
  assert((await commitTreeSha(head.commitSha)) === head.treeSha, "branch_head_commit_tree_mismatch");

  const outputs = Array.isArray(receipt.boundOutputs) ? receipt.boundOutputs : [];
  assert(outputs.length > 0, "parallel_receipt_has_no_bound_outputs");
  const outputProofs = [];

  for (const output of outputs) {
    assert(Number.isInteger(output.ownerThread) && output.ownerThread >= 0 && output.ownerThread <= 9, `invalid_owner_thread:${output.ownerThread}`);
    assert(output.ownerThread !== 8, "thread8_receipt_must_not_relabel_own_output_as_foreign_worker_output");
    await assertGitObject(output.commitSha, "commit", `thread${output.ownerThread}_commit`);
    await assertGitObject(output.treeSha, "tree", `thread${output.ownerThread}_tree`);
    const actualTreeSha = await commitTreeSha(output.commitSha);
    assert(actualTreeSha === output.treeSha, `commit_tree_mismatch:${output.commitSha}:expected=${output.treeSha}:actual=${actualTreeSha}`);

    let artifactProof = null;
    const artifact = output.artifact ?? output.inspectedArtifactExample ?? null;
    if (artifact?.path && artifact?.gitBlobSha) artifactProof = await verifyBlobPointer(artifact);

    if (output.completionAssertion === "CODE_PRESENT_NOT_EXECUTION_PROOF") {
      assert(output.inspectedTruth?.routerCodePresent === true, "code_present_assertion_requires_router_code_present");
      assert(output.inspectedTruth?.routeOutputFromThisCommit === false, "code_present_commit_must_not_claim_route_output");
    }
    if (output.completionAssertion === "PREFLIGHT_NOT_ROUTED") {
      assert(Number(output.inspectedTruth?.safeFinalModuleRoutesWritten ?? 0) === 0, "preflight_receipt_cannot_hide_final_routes");
    }
    if (output.completionAssertion === "BLOCKED_NOT_COMPLETE") {
      assert(String(output.inspectedTruth?.currentState ?? "").startsWith("BLOCKED_"), "blocked_assertion_requires_blocked_state");
    }

    outputProofs.push({
      ownerThread: output.ownerThread,
      commitSha: output.commitSha,
      treeSha: output.treeSha,
      completionAssertion: output.completionAssertion,
      artifactProof,
    });
  }

  const thread9 = receipt.thread9RuntimeTruth ?? {};
  assert(Number(thread9.total) === workerStatusTotal(thread9), `thread9_status_total_mismatch:${thread9.total}:${workerStatusTotal(thread9)}`);
  if (thread9.executionProofState === "NO_FENCED_EXECUTION_PROOF_YET") {
    assert(Number(thread9.running ?? 0) === 0, "thread9_no_proof_state_cannot_have_running_workers");
    assert(Number(thread9.succeeded ?? 0) === 0, "thread9_no_proof_state_cannot_have_succeeded_workers");
    assert(Number(thread9.failed ?? 0) === 0, "thread9_no_proof_state_cannot_have_failed_workers");
    assert(Number(thread9.leased ?? 0) === 0, "thread9_no_proof_state_cannot_have_leased_workers");
    assert(Number(thread9.maxAttempt ?? 0) === 0, "thread9_no_proof_state_cannot_have_attempts");
  }
  assert(thread9.lockIsNotExecutionProof === true, "thread9_lock_must_not_equal_execution_proof");

  assert(receipt.notAsserted?.finalConvergence === false, "parallel_receipt_must_not_assert_final_convergence_without_proof");
  assert(receipt.state !== "COMPLETE" && receipt.state !== "VERIFIED_LIVE", "parallel_receipt_intermediate_state_must_not_be_complete");

  return {
    kind: "parallel_output_receipt",
    ok: true,
    evidenceFile: path.relative(ROOT, receiptPath),
    outputsVerified: outputProofs.length,
    ownerThreadsRepresented: [...new Set(outputProofs.map((proof) => proof.ownerThread))].sort((a, b) => a - b),
    thread9ExecutionProofState: thread9.executionProofState,
    receiptState: receipt.state,
  };
}

async function main() {
  const names = await readdir(EVIDENCE_DIR);
  const manifestNames = names.filter((name) => MANIFEST_PATTERN.test(name)).sort();
  const receiptNames = names.filter((name) => RECEIPT_PATTERN.test(name)).sort();
  assert(manifestNames.length > 0, "no_thread_8_durability_manifest_found");

  const results = [];
  for (const name of manifestNames) results.push(await verifyDurabilityManifest(path.join(EVIDENCE_DIR, name)));
  for (const name of receiptNames) results.push(await verifyParallelOutputReceipt(path.join(EVIDENCE_DIR, name)));

  process.stdout.write(`${JSON.stringify({
    ok: true,
    durabilityManifestsVerified: manifestNames.length,
    parallelOutputReceiptsVerified: receiptNames.length,
    results,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2)}\n`);
  process.exitCode = 1;
});
