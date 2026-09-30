import "server-only";

import { createClient } from "@/lib/supabase/server";

type BridgeListInput = {
  mapId?: string;
  sourceKey?: string;
  actorRef?: string;
  mine?: boolean;
  admin?: boolean;
  limit?: number;
  minX?: number | null;
  minY?: number | null;
  maxX?: number | null;
  maxY?: number | null;
};

function getBridgeSecret() {
  const secret = process.env.PANTAVION_WATER_DB_BRIDGE_SECRET?.trim() || "";
  if (!secret) throw new Error("water_db_bridge_not_configured");
  return secret;
}

async function callBridge<T>(name: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, {
    p_secret: getBridgeSecret(),
    ...args,
  });

  if (error) {
    throw new Error("water_db_bridge_rpc_failed");
  }

  return data as T;
}

export async function listWaterSpatialPatchesViaBridge(input: BridgeListInput) {
  return callBridge<{ ok?: boolean; patches?: unknown[] }>(
    "pantavion_water_bridge_patch_list_v1",
    {
      p_map_id: input.mapId || null,
      p_source_key: input.sourceKey || null,
      p_actor_ref: input.actorRef || null,
      p_mine: Boolean(input.mine),
      p_admin: Boolean(input.admin),
      p_limit: input.limit ?? 200,
      p_min_x: input.minX ?? null,
      p_min_y: input.minY ?? null,
      p_max_x: input.maxX ?? null,
      p_max_y: input.maxY ?? null,
    },
  );
}

export async function getWaterSpatialPatchViaBridge(patchId: string) {
  return callBridge<{ ok?: boolean; error?: string; patch?: Record<string, unknown> }>(
    "pantavion_water_bridge_patch_get_v1",
    { p_patch_id: patchId },
  );
}

export async function insertWaterSpatialPatchViaBridge(record: Record<string, unknown>) {
  return callBridge<{
    ok?: boolean;
    error?: string;
    deduplicated?: boolean;
    patch?: Record<string, unknown>;
  }>("pantavion_water_bridge_patch_insert_v1", {
    p_record: record,
  });
}

export async function reviewWaterSpatialPatchViaBridge(input: {
  patchId: string;
  nextStatus: string;
  decisionNote?: string | null;
  reviewedBy: string;
}) {
  return callBridge<{
    ok?: boolean;
    error?: string;
    unchanged?: boolean;
    patch?: Record<string, unknown>;
    currentStatus?: string;
    requestedStatus?: string;
  }>("pantavion_water_bridge_patch_review_v1", {
    p_patch_id: input.patchId,
    p_next_status: input.nextStatus,
    p_decision_note: input.decisionNote || null,
    p_reviewed_by: input.reviewedBy,
  });
}
