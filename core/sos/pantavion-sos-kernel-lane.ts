import "server-only";

import { createHash } from "node:crypto";
import {
  appendCheckpoint,
  createExecutionRecord,
  type PantavionDurableExecutionRecord,
} from "@/core/runtime/durable-execution";
import { createSupabaseDurableExecutionStore } from "@/core/runtime/supabase-durable-execution-store";
import type { PantavionSosPacket } from "@/types/pantavion-sos";

export const PANTAVION_SOS_KERNEL_TASK = "pantavion:sos:intake:v1";

export type PantavionSosKernelIntakeResult = {
  record: PantavionDurableExecutionRecord;
  deduplicated: boolean;
};

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function safePacketMetadata(packet: PantavionSosPacket, receivedAt: string) {
  return {
    marker: "pantavion_sos_kernel_intake_v1",
    kernelLane: "sos",
    priority: "critical",
    packetIdDigest: digest(packet.id),
    packetCreatedAt: packet.createdAt,
    receivedAt,
    source: packet.source,
    primaryLanguage: packet.profile.primaryLanguage,
    consent: packet.profile.consent === true,
    locationPresent: packet.location !== null,
    trustedContactCount: Array.isArray(packet.profile.contacts) ? packet.profile.contacts.length : 0,
    offlineQueued: packet.offlineQueued === true,
    deliveryAttempts: Number.isFinite(packet.deliveryAttempts) ? packet.deliveryAttempts : 0,
    authorityDispatchClaimed: false,
    sensitivePayloadStoredInDurableQueue: false,
  } as const;
}

export async function persistPantavionSosKernelIntake(
  packet: PantavionSosPacket,
  receivedAt: string,
): Promise<PantavionSosKernelIntakeResult> {
  const packetId = packet.id.trim();
  if (!packetId) throw new Error("sos_packet_id_required");
  if (!packet.profile?.consent) throw new Error("sos_profile_consent_required");

  const store = createSupabaseDurableExecutionStore();
  const packetDigest = digest(packetId);
  const idempotencyKey = `pantavion:sos:intake:${packetDigest}`;
  const existing = await store.findByIdempotencyKey(idempotencyKey);
  if (existing) return { record: existing, deduplicated: true };

  const executionId = `sos-intake:${packetDigest.slice(0, 40)}`;
  const metadata = safePacketMetadata(packet, receivedAt);
  let record = createExecutionRecord(
    executionId,
    idempotencyKey,
    PANTAVION_SOS_KERNEL_TASK,
    metadata,
    1,
  );

  record = appendCheckpoint(
    {
      ...record,
      status: "succeeded",
      output: {
        marker: "pantavion_sos_kernel_intake_receipt_v1",
        accepted: true,
        kernelLane: "sos",
        priority: "critical",
        authorityDispatchClaimed: false,
        externalDeliveryVerified: false,
      },
      updatedAt: new Date().toISOString(),
    },
    "sos_intake_persisted",
    {
      kernelLane: "sos",
      priority: "critical",
      externalDeliveryVerified: false,
    },
  );

  await store.put(record);
  return { record, deduplicated: false };
}
