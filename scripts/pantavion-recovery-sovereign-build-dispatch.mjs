import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

import {
  createPantavionRecoverySovereignBuildOrder,
  derivePantavionRecoveryBuildOrderId,
  digestPantavionRecoveryWorkUnitForDispatch,
  materializePantavionRecoverySovereignDispatchRecord,
  resolvePantavionRecoveryCanonicalBuildRoute,
} from "../core/recovery/pantavion-recovery-sovereign-build-dispatch.ts";
import {
  PANTAVION_RECOVERY_CORPUS_CONTRACT,
  assertPantavionRecoveryRuntimeCounts,
} from "../core/recovery/pantavion-recovery-runtime-fabric.ts";

const root = process.cwd();
const require = createRequire(import.meta.url);
const sovereignKernelRuntimePath = process.env.PANTAVION_SOVEREIGN_KERNEL_RUNTIME;
if (typeof sovereignKernelRuntimePath !== "string" || !sovereignKernelRuntimePath.trim()) {
  throw new Error("recovery_dispatch_sovereign_kernel_runtime_required");
}
const sovereignKernelRuntime = require(path.resolve(root, sovereignKernelRuntimePath));
const sovereignKernelCompiler = sovereignKernelRuntime?.compileSovereignKernelDecision;
if (typeof sovereignKernelCompiler !== "function") {
  throw new Error("recovery_dispatch_sovereign_kernel_compiler_missing");
}

const runtimeRoot = path.join(root, "data/recovery/runtime-fabric-v1");
const runtimeManifestPath = path.join(runtimeRoot, "manifest.json");
const workUnitsPath = path.join(runtimeRoot, "recovery-work-units.ndjson");
const outRoot = path.join(root, "data/recovery/sovereign-build-dispatch-v1");
const dispatchLedgerPath = path.join(outRoot, "dispatch-ledger.ndjson");
const buildOrdersPath = path.join(outRoot, "sovereign-build-orders.ndjson");
const manifestPath = path.join(outRoot, "manifest.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requireEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}_mismatch:${String(actual)}!=${String(expected)}`);
  }
}

function expectFailure(label, action) {
  let failed = false;
  try {
    action();
  } catch {
    failed = true;
  }
  if (!failed) throw new Error(`${label}_must_fail_closed`);
}

function updateOrderedHash(hash, value, ordinal) {
  if (ordinal > 1) hash.update("\n");
  hash.update(value);
}

function verifyRuntimeManifest(manifest) {
  const contract = PANTAVION_RECOVERY_CORPUS_CONTRACT;
  requireEqual("dispatch_runtime_manifest_id", manifest.id, "pantavion_recovery_runtime_fabric_materialization_v1");
  requireEqual("dispatch_runtime_record_count", manifest.corpus?.sourceRecordCount, contract.sourceRecordCount);
  requireEqual("dispatch_runtime_source_fingerprint", manifest.corpus?.sourceFingerprint, contract.sourceFingerprint);
  requireEqual("dispatch_runtime_ordered_ids", manifest.corpus?.orderedIdFingerprint, contract.orderedIdFingerprint);
  requireEqual("dispatch_runtime_work_units", manifest.materialization?.workUnitCount, contract.sourceRecordCount);
  assertPantavionRecoveryRuntimeCounts(manifest.materialization?.counts);
  if (Object.values(manifest.authority ?? {}).some(Boolean)) {
    throw new Error("dispatch_runtime_manifest_authority_forbidden");
  }
  requireEqual("dispatch_runtime_completion", manifest.completion, false);
}

async function materializeSovereignBuildDispatch() {
  const runtimeManifest = readJson(runtimeManifestPath);
  verifyRuntimeManifest(runtimeManifest);

  fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(outRoot, { recursive: true });
  const dispatchOutput = fs.createWriteStream(dispatchLedgerPath, {
    encoding: "utf8",
    flags: "wx",
  });
  const input = readline.createInterface({
    input: fs.createReadStream(workUnitsPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const dispatchCounts = {
    AWAITING_OWNER_SCOPED_BUILD: 0,
    BLOCKED_GOVERNED_HOLD: 0,
    BLOCKED_RECURSIVE_PROVENANCE: 0,
  };
  const groups = new Map();
  const seenRecordIds = new Set();
  const seenWorkUnitIds = new Set();
  const orderedWorkUnitIdHash = createHash("sha256");
  const orderedDispatchDigestHash = createHash("sha256");
  let ordinal = 0;
  let expectedPreviousWorkUnitDigest = null;
  let previousDispatchDigest = null;
  let firstCandidateContext = null;

  try {
    for await (const line of input) {
      if (!line.trim()) continue;
      const unit = JSON.parse(line);
      ordinal += 1;
      const context = {
        unit,
        expectedGlobalOrdinal: ordinal,
        expectedPreviousWorkUnitDigest,
        previousDispatchDigest,
      };
      const dispatch = materializePantavionRecoverySovereignDispatchRecord(context);

      if (seenRecordIds.has(dispatch.recordId)) {
        throw new Error(`recovery_dispatch_duplicate_record:${dispatch.recordId}`);
      }
      if (seenWorkUnitIds.has(dispatch.workUnitId)) {
        throw new Error(`recovery_dispatch_duplicate_work_unit:${dispatch.workUnitId}`);
      }
      seenRecordIds.add(dispatch.recordId);
      seenWorkUnitIds.add(dispatch.workUnitId);
      dispatchCounts[dispatch.disposition] += 1;
      updateOrderedHash(orderedWorkUnitIdHash, dispatch.workUnitId, ordinal);
      updateOrderedHash(orderedDispatchDigestHash, dispatch.dispatchDigest, ordinal);

      if (dispatch.disposition === "AWAITING_OWNER_SCOPED_BUILD") {
        const route = resolvePantavionRecoveryCanonicalBuildRoute(unit);
        const buildOrderId = derivePantavionRecoveryBuildOrderId(route);
        requireEqual("dispatch_build_order_binding", dispatch.buildOrderId, buildOrderId);
        let group = groups.get(buildOrderId);
        if (!group) {
          group = {
            buildOrderId,
            route,
            memberCount: 0,
            firstGlobalOrdinal: ordinal,
            lastGlobalOrdinal: ordinal,
            memberHash: createHash("sha256"),
          };
          groups.set(buildOrderId, group);
        } else if (JSON.stringify(group.route) !== JSON.stringify(route)) {
          throw new Error(`recovery_dispatch_route_hash_collision:${buildOrderId}`);
        }
        group.memberCount += 1;
        group.lastGlobalOrdinal = ordinal;
        updateOrderedHash(group.memberHash, unit.workUnitId, group.memberCount);
        firstCandidateContext ??= structuredClone(context);
      }

      expectedPreviousWorkUnitDigest = unit.workUnitDigest;
      previousDispatchDigest = dispatch.dispatchDigest;
      if (!dispatchOutput.write(`${JSON.stringify(dispatch)}\n`)) {
        await new Promise((resolve) => dispatchOutput.once("drain", resolve));
      }
    }
  } finally {
    input.close();
    await new Promise((resolve, reject) => {
      dispatchOutput.end(resolve);
      dispatchOutput.on("error", reject);
    });
  }

  const contract = PANTAVION_RECOVERY_CORPUS_CONTRACT;
  requireEqual("dispatch_record_count", ordinal, contract.sourceRecordCount);
  requireEqual("dispatch_unique_records", seenRecordIds.size, ordinal);
  requireEqual("dispatch_unique_work_units", seenWorkUnitIds.size, ordinal);
  requireEqual(
    "dispatch_candidate_count",
    dispatchCounts.AWAITING_OWNER_SCOPED_BUILD,
    contract.classifiedCount,
  );
  requireEqual(
    "dispatch_hold_count",
    dispatchCounts.BLOCKED_GOVERNED_HOLD,
    contract.governedHoldCount,
  );
  requireEqual(
    "dispatch_recursive_count",
    dispatchCounts.BLOCKED_RECURSIVE_PROVENANCE,
    contract.recursiveQuarantineCount,
  );

  const orderedWorkUnitIdFingerprint = orderedWorkUnitIdHash.digest("hex");
  requireEqual(
    "dispatch_work_unit_fingerprint",
    orderedWorkUnitIdFingerprint,
    runtimeManifest.materialization?.workUnitIdFingerprint,
  );
  requireEqual(
    "dispatch_terminal_work_unit",
    expectedPreviousWorkUnitDigest,
    runtimeManifest.materialization?.terminalWorkUnitDigest,
  );
  if (!firstCandidateContext) throw new Error("dispatch_candidate_negative_fixture_missing");

  const digestTamper = structuredClone(firstCandidateContext);
  digestTamper.unit.workUnitDigest = "0".repeat(64);
  expectFailure("dispatch_work_unit_digest_tamper", () => {
    materializePantavionRecoverySovereignDispatchRecord(digestTamper);
  });

  const authorityTamper = structuredClone(firstCandidateContext);
  authorityTamper.unit.governance.executionAuthority = true;
  authorityTamper.unit.workUnitDigest =
    digestPantavionRecoveryWorkUnitForDispatch(authorityTamper.unit);
  expectFailure("dispatch_work_unit_authority_tamper", () => {
    materializePantavionRecoverySovereignDispatchRecord(authorityTamper);
  });

  const buildOutput = fs.createWriteStream(buildOrdersPath, {
    encoding: "utf8",
    flags: "wx",
  });
  const sortedGroups = [...groups.values()].sort((left, right) =>
    left.buildOrderId.localeCompare(right.buildOrderId),
  );
  const orderedBuildOrderIdHash = createHash("sha256");
  const orderedBuildOrderDigestHash = createHash("sha256");
  const decisionCounts = {
    denied: 0,
    awaiting_owner: 0,
    ready_for_bounded_execution: 0,
  };
  let groupedCandidateCount = 0;
  let previousBuildOrderDigest = null;
  let firstBuildFixture = null;

  try {
    for (let index = 0; index < sortedGroups.length; index += 1) {
      const group = sortedGroups[index];
      const membership = {
        memberCount: group.memberCount,
        firstGlobalOrdinal: group.firstGlobalOrdinal,
        lastGlobalOrdinal: group.lastGlobalOrdinal,
        orderedMemberWorkUnitIdFingerprint: group.memberHash.digest("hex"),
      };
      const buildOrder = createPantavionRecoverySovereignBuildOrder({
        buildOrderOrdinal: index + 1,
        route: group.route,
        membership,
        previousBuildOrderDigest,
        sovereignKernelCompiler,
      });
      requireEqual("build_order_sorted_identity", buildOrder.buildOrderId, group.buildOrderId);
      decisionCounts[buildOrder.sovereignDecision.disposition] += 1;
      groupedCandidateCount += buildOrder.membership.memberCount;
      updateOrderedHash(orderedBuildOrderIdHash, buildOrder.buildOrderId, index + 1);
      updateOrderedHash(
        orderedBuildOrderDigestHash,
        buildOrder.buildOrderDigest,
        index + 1,
      );
      previousBuildOrderDigest = buildOrder.buildOrderDigest;
      firstBuildFixture ??= {
        buildOrderOrdinal: 1,
        route: structuredClone(buildOrder.route),
        membership: structuredClone(buildOrder.membership),
        previousBuildOrderDigest: null,
      };
      if (!buildOutput.write(`${JSON.stringify(buildOrder)}\n`)) {
        await new Promise((resolve) => buildOutput.once("drain", resolve));
      }
    }
  } finally {
    await new Promise((resolve, reject) => {
      buildOutput.end(resolve);
      buildOutput.on("error", reject);
    });
  }

  if (!sortedGroups.length || !firstBuildFixture) {
    throw new Error("recovery_build_orders_missing");
  }
  requireEqual(
    "recovery_build_grouped_candidate_count",
    groupedCandidateCount,
    contract.classifiedCount,
  );
  requireEqual(
    "recovery_build_awaiting_owner_count",
    decisionCounts.awaiting_owner,
    sortedGroups.length,
  );
  requireEqual("recovery_build_denied_count", decisionCounts.denied, 0);
  requireEqual(
    "recovery_build_execution_ready_count",
    decisionCounts.ready_for_bounded_execution,
    0,
  );

  const emptyMembership = structuredClone(firstBuildFixture);
  emptyMembership.membership.memberCount = 0;
  expectFailure("recovery_build_empty_membership", () => {
    createPantavionRecoverySovereignBuildOrder({
      ...emptyMembership,
      sovereignKernelCompiler,
    });
  });

  const missingCapability = structuredClone(firstBuildFixture);
  missingCapability.route.capability = "";
  expectFailure("recovery_build_missing_capability", () => {
    createPantavionRecoverySovereignBuildOrder({
      ...missingCapability,
      sovereignKernelCompiler,
    });
  });

  const manifest = {
    marker: "pantavion_recovery_sovereign_build_dispatch_manifest_v1",
    sourceRuntimeManifestPath: path.relative(root, runtimeManifestPath),
    corpus: {
      sourceRecordCount: ordinal,
      sourceFingerprint: contract.sourceFingerprint,
      orderedIdFingerprint: contract.orderedIdFingerprint,
    },
    dispatch: {
      dispatchRecordCount: ordinal,
      dispatchCounts,
      terminalDispatchDigest: previousDispatchDigest,
      orderedDispatchDigestFingerprint: orderedDispatchDigestHash.digest("hex"),
      orderedWorkUnitIdFingerprint,
      terminalWorkUnitDigest: expectedPreviousWorkUnitDigest,
      rawPayloadDuplicatedIntoControlPlane: false,
    },
    sovereignBuildOrders: {
      canonicalBuildOrderCount: sortedGroups.length,
      groupedCandidateCount,
      decisionCounts,
      orderedBuildOrderIdFingerprint: orderedBuildOrderIdHash.digest("hex"),
      orderedBuildOrderDigestFingerprint: orderedBuildOrderDigestHash.digest("hex"),
      terminalBuildOrderDigest: previousBuildOrderDigest,
      ephemeralAgentGrantIssuedCount: 0,
      technologyAssessmentRequiredCount: sortedGroups.length,
      disconnectedExecutionEligibleCount: 0,
      ownerApprovalRequiredCount: sortedGroups.length,
    },
    authority: {
      analysisAuthority: true,
      planningAuthority: true,
      codeMutationAuthority: false,
      executionAuthority: false,
      productionWriteAuthority: false,
      mergeAuthority: false,
      deploymentAuthority: false,
      publicExposureAuthority: false,
      releaseAuthority: false,
    },
    sovereignBuildDispatchLifecycleState: "CODED",
    negativeCasesVerified: true,
    completion: false,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    flag: "wx",
  });
  console.log(JSON.stringify(manifest, null, 2));
}

await materializeSovereignBuildDispatch();
