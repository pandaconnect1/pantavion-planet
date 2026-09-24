import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FaultActionBody = {
  action?: "list" | "create" | "status";
  deviceId?: string;
  deviceToken?: string;
  fault?: Record<string, unknown>;
  id?: string;
  status?: string;
};

function clean(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function toClientFault(row: any) {
  return {
    id: String(row.id || ""),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
    reportedBy: String(row.reported_by || ""),
    area: String(row.area || ""),
    street: String(row.street || ""),
    number: String(row.street_number || ""),
    postal: String(row.postal || ""),
    zone: String(row.zone || ""),
    faultType: String(row.fault_type || "other"),
    priority: String(row.priority || "normal"),
    status: String(row.status || "new"),
    assignedCrew: String(row.assigned_crew || ""),
    affectedConsumers: String(row.affected_consumers || ""),
    waterCutoff: Boolean(row.water_cutoff),
    valveProblem: Boolean(row.valve_problem),
    materials: String(row.materials || ""),
    notes: String(row.notes || ""),
    supervisorDecision: String(row.supervisor_decision || ""),
  };
}

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function POST(request: Request) {
  let body: FaultActionBody;

  try {
    body = (await request.json()) as FaultActionBody;
  } catch {
    return noStoreJson({ ok: false, error: "invalid_request" }, 400);
  }

  const action = body.action || "list";
  const deviceId = clean(body.deviceId, 160);
  const deviceToken = clean(body.deviceToken, 1000);
  const tokenHash = deviceToken ? hashToken(deviceToken) : "";
  const supabase = await createClient();

  try {
    if (action === "list") {
      const { data, error } = await supabase.rpc("pantavion_water_fault_list", {
        p_device_id: deviceId,
        p_token_hash: tokenHash,
        p_limit: 300,
      });

      if (error) throw error;

      return noStoreJson({
        ok: true,
        faults: (Array.isArray(data) ? data : []).map(toClientFault),
        storage: "supabase",
      });
    }

    if (action === "create") {
      if (!body.fault || typeof body.fault !== "object") {
        return noStoreJson({ ok: false, error: "fault_required" }, 400);
      }

      const { data, error } = await supabase.rpc("pantavion_water_fault_create", {
        p_device_id: deviceId,
        p_token_hash: tokenHash,
        p_fault: body.fault,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("fault_create_empty");

      return noStoreJson({
        ok: true,
        fault: toClientFault(row),
        storage: "supabase",
      });
    }

    if (action === "status") {
      const id = clean(body.id, 160);
      const status = clean(body.status, 80);

      if (!id || !status) {
        return noStoreJson({ ok: false, error: "fault_status_required" }, 400);
      }

      const { data, error } = await supabase.rpc("pantavion_water_fault_set_status", {
        p_device_id: deviceId,
        p_token_hash: tokenHash,
        p_id: id,
        p_status: status,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("fault_status_empty");

      return noStoreJson({
        ok: true,
        fault: toClientFault(row),
        storage: "supabase",
      });
    }

    return noStoreJson({ ok: false, error: "unknown_action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "fault_registry_failed";
    const accessDenied = message.includes("water_access_required");

    return noStoreJson(
      {
        ok: false,
        error: accessDenied ? "water_access_required" : "fault_registry_failed",
      },
      accessDenied ? 403 : 500,
    );
  }
}
