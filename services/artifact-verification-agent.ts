import { createHash, randomUUID } from "node:crypto";

import {
  createPantavionArtifactIntakeRecord,
  createPantavionArtifactWorkOrderCandidate,
  type PantavionArtifactIntakeRecord,
} from "@/core/intake/pantavion-universal-artifact-intake";
import { persistPantavionFounderWorkOrder } from "@/core/kernel/pantavion-work-order-runtime";
import {
  isSucceededPantavionArtifactVerification,
  PANTAVION_ARTIFACT_HASH_VERIFICATION_OUTPUT_MARKER,
  PANTAVION_ARTIFACT_HASH_VERIFICATION_TASK,
  requirePantavionArtifactHashVerificationInput,
  type PantavionArtifactHashVerificationOutput,
} from "@/core/runtime/pantavion-artifact-verification-runtime";
import type { PantavionDurableExecutionRecord } from "@/core/runtime/durable-execution";
import {
  PantavionStaleExecutionFenceError,
  type PantavionExecutionFence,
} from "@/core/runtime/durable-execution-fencing";
import { createSupabaseDurableExecutionStore } from "@/core/runtime/supabase-durable-execution-store";
import { createAdminClient } from "@/lib/supabase/admin";

const POLL_INTERVAL_MS = Number(process.env.ARTIFACT_VERIFICATION_AGENT_POLL_MS) || 5_000;
const LEASE_MS = 240_000;
const HEARTBEAT_INTERVAL_MS = 30_000;
const CHECKPOINT_BYTES = 256 * 1024 * 1024;
const SIGNED_READ_SECONDS = 6 * 60 * 60;

type DurableStore = ReturnType<typeof createSupabaseDurableExecutionStore>;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function signedReadUrl(bucket: string, path: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, SIGNED_READ_SECONDS);
  if (error || !data?.signedUrl) throw new Error("artifact_verifier_signed_read_failed");
  return data.signedUrl;
}

async function streamSha256(input: {
  bucket: string;
  path: string;
  expectedSizeBytes: number;
  fence: PantavionExecutionFence;
  durable: DurableStore;
}) {
  const url = await signedReadUrl(input.bucket, input.path);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok || !response.body) {
    throw new Error(`artifact_verifier_read_http_${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 0 && contentLength !== input.expectedSizeBytes) {
    await response.body.cancel().catch(() => undefined);
    throw new Error("artifact_verifier_content_length_mismatch");
  }

  const hash = createHash("sha256");
  const reader = response.body.getReader();
  let observedSizeBytes = 0;
  let lastHeartbeat = Date.now();
  let nextCheckpoint = CHECKPOINT_BYTES;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      observedSizeBytes += value.byteLength;
      if (observedSizeBytes > input.expectedSizeBytes) {
        throw new Error("artifact_verifier_stream_exceeds_expected_size");
      }
      hash.update(value);

      const now = Date.now();
      if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
        await input.durable.heartbeatFenced(input.fence, LEASE_MS);
        lastHeartbeat = now;
      }
      if (observedSizeBytes >= nextCheckpoint) {
        await input.durable.checkpointFenced(input.fence, "artifact_hash_stream_progress", {
          observedSizeBytes,
          expectedSizeBytes: input.expectedSizeBytes,
          progress: Number((observedSizeBytes / input.expectedSizeBytes).toFixed(6)),
          fullHashVerified: false,
        });
        nextCheckpoint += CHECKPOINT_BYTES;
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (observedSizeBytes !== input.expectedSizeBytes) {
    throw new Error("artifact_verifier_observed_size_mismatch");
  }

  return {
    observedSizeBytes,
    computedSha256: hash.digest("hex"),
  };
}

async function materializeSucceededArtifactWorkOrders(durable: DurableStore, limit = 200) {
  const executions = await durable.list(limit);
  let materialized = 0;
  let deduplicated = 0;

  for (const execution of executions) {
    if (!isSucceededPantavionArtifactVerification(execution)) continue;
    const output = execution.output as PantavionArtifactHashVerificationOutput;
    const artifact = output.artifact as PantavionArtifactIntakeRecord;
    if (!artifact?.intakeId || artifact.intakeId !== output.verifiedIntakeId) continue;
    if (artifact.file?.sha256 !== output.computedSha256 || artifact.file?.sha256VerifiedFromBytes !== true) continue;

    const candidate = createPantavionArtifactWorkOrderCandidate(artifact);
    const persisted = await persistPantavionFounderWorkOrder(candidate.submission);
    if (persisted.deduplicated) deduplicated += 1;
    else materialized += 1;
  }

  return { materialized, deduplicated };
}

async function processVerification(
  durable: DurableStore,
  workerId: string,
  execution: PantavionDurableExecutionRecord,
) {
  const claimed = await durable.claimFenced(
    execution.executionId,
    workerId,
    LEASE_MS,
    ["queued", "planned"],
  );
  if (!claimed) return;

  const { fence } = claimed;
  const input = requirePantavionArtifactHashVerificationInput(claimed.record.input);

  try {
    await durable.checkpointFenced(fence, "artifact_hash_verification_started", {
      worker: "pantavion_owned_artifact_verification_agent",
      expectedSizeBytes: input.expectedSizeBytes,
      bucket: input.bucket,
      path: input.path,
      directExecutionAllowed: false,
    });
    await durable.heartbeatFenced(fence, LEASE_MS);

    const streamed = await streamSha256({
      bucket: input.bucket,
      path: input.path,
      expectedSizeBytes: input.expectedSizeBytes,
      fence,
      durable,
    });

    const declaredSha256Matched = input.declaredSha256
      ? input.declaredSha256 === streamed.computedSha256
      : null;

    if (declaredSha256Matched === false) {
      await durable.checkpointFenced(fence, "artifact_declared_hash_mismatch", {
        computedSha256: streamed.computedSha256,
        declaredSha256: input.declaredSha256,
        observedSizeBytes: streamed.observedSizeBytes,
        originalPreserved: true,
        downstreamWorkOrderAllowed: false,
      });
      await durable.finishFencedFailure(fence, "artifact_declared_hash_mismatch");
      return;
    }

    const artifact = createPantavionArtifactIntakeRecord({
      sourceKind: "storage_reference",
      sourceId: `upload:${input.uploadId}`,
      fileName: input.fileName,
      sizeBytes: input.expectedSizeBytes,
      mimeType: input.mimeType,
      sha256: streamed.computedSha256,
      sha256VerifiedFromBytes: true,
      firstBytesBase64: input.firstBytesBase64,
      storageReference: `${input.bucket}:${input.path}`,
      domains: input.domains,
      notes: [
        "full_hash_verification:fenced_worker_verified",
        `verification_execution:${execution.executionId}`,
        `provisional_intake:${input.provisionalIntakeId}`,
      ],
    });

    const output: PantavionArtifactHashVerificationOutput = {
      marker: PANTAVION_ARTIFACT_HASH_VERIFICATION_OUTPUT_MARKER,
      uploadId: input.uploadId,
      provisionalIntakeId: input.provisionalIntakeId,
      verifiedIntakeId: artifact.intakeId,
      bucket: input.bucket,
      path: input.path,
      fileName: input.fileName,
      expectedSizeBytes: input.expectedSizeBytes,
      observedSizeBytes: streamed.observedSizeBytes,
      computedSha256: streamed.computedSha256,
      declaredSha256: input.declaredSha256,
      declaredSha256Matched,
      artifact,
    };

    await durable.checkpointFenced(fence, "artifact_hash_verified", {
      computedSha256: streamed.computedSha256,
      observedSizeBytes: streamed.observedSizeBytes,
      verifiedIntakeId: artifact.intakeId,
      originalPreserved: true,
      fullHashVerified: true,
      downstreamWorkOrderAllowed: true,
    });
    await durable.finishFencedSuccess(fence, output);
  } catch (error) {
    if (error instanceof PantavionStaleExecutionFenceError) {
      console.warn("[artifact-verification-agent] stale lease; abandoning", execution.executionId);
      return;
    }
    console.error("[artifact-verification-agent] verification failed", execution.executionId, error);
    try {
      await durable.finishFencedFailure(fence, errorMessage(error));
    } catch (finishError) {
      if (finishError instanceof PantavionStaleExecutionFenceError) {
        console.warn("[artifact-verification-agent] lease lost before failure finalization", execution.executionId);
        return;
      }
      throw finishError;
    }
  }
}

export async function startArtifactVerificationAgent() {
  console.log("[artifact-verification-agent] starting");
  const durable = createSupabaseDurableExecutionStore();
  const workerId = `artifact-verification-agent:${process.pid}:${randomUUID()}`;

  async function poll() {
    try {
      await materializeSucceededArtifactWorkOrders(durable);
      const executions = await durable.list(100);
      for (const execution of executions) {
        if (execution.taskName !== PANTAVION_ARTIFACT_HASH_VERIFICATION_TASK) continue;
        if (!["queued", "planned"].includes(execution.status)) continue;
        await processVerification(durable, workerId, execution);
        await materializeSucceededArtifactWorkOrders(durable);
      }
    } catch (error) {
      console.error("[artifact-verification-agent] poll error", error);
    } finally {
      setTimeout(poll, POLL_INTERVAL_MS);
    }
  }

  void poll();
}

if (typeof require !== "undefined" && require.main === module) {
  startArtifactVerificationAgent().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
