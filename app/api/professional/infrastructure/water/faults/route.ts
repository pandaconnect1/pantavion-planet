import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Advanced water fault form submission
interface WaterFaultSubmission {
  location: {
    asset_number: string;
    street: string;
    area_code: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  damage: string;
  materials: Array<{
    type: 'pipe' | 'valve' | 'tank' | 'soil' | 'coupling';
    name: string;
    quantity: number;
    unit: string;
    condition: 'good' | 'damaged' | 'broken';
  }>;
  excavation: {
    width_cm: number;
    length_cm: number;
    depth_cm: number;
    soil_type: 'asphalt' | 'concrete' | 'soil' | 'rock' | 'mixed';
    volume_m3: number;
  };
  photos: Array<{
    url: string;
    type: 'excavation' | 'damage' | 'material' | 'before' | 'after';
  }>;
  crew?: {
    names: string;
    permit_number?: string;
  };
}

// Legacy fault body for backward compatibility
type FaultActionBody = {
  action?: "list" | "create" | "status" | "submit_advanced";
  deviceId?: string;
  deviceToken?: string;
  fault?: Record<string, unknown>;
  id?: string;
  status?: string;
  submission?: WaterFaultSubmission;
};

function clean(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

type FaultRow = Record<string, unknown>;

function toClientFault(row: FaultRow) {
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

    // Advanced water fault form submission (new)
    if (action === "submit_advanced") {
      const submission = body.submission as WaterFaultSubmission;

      if (!submission?.location?.asset_number || !submission?.location?.street || !submission?.location?.area_code) {
        return noStoreJson({ ok: false, error: "location_required" }, 400);
      }

      // Generate fault ID
      const faultId = `FAULT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 1. Insert main fault record
      const { data: faultData, error: faultError } = await supabase
        .from('water_fault_records')
        .insert({
          id: faultId,
          asset_number: submission.location.asset_number,
          street: submission.location.street,
          area_code: submission.location.area_code,
          severity: submission.location.severity,
          description: submission.damage,
          excavation_width_cm: submission.excavation.width_cm,
          excavation_length_cm: submission.excavation.length_cm,
          excavation_depth_cm: submission.excavation.depth_cm,
          excavation_volume_m3: submission.excavation.volume_m3,
          soil_type: submission.excavation.soil_type,
          crew_names: submission.crew?.names || null,
          permit_number: submission.crew?.permit_number || null,
          created_at: new Date().toISOString(),
          status: 'recorded',
        })
        .select()
        .single();

      if (faultError) {
        throw new Error(`fault_insert_error: ${faultError.message}`);
      }

      // 2. Insert materials
      if (submission.materials && submission.materials.length > 0) {
        const materialsData = submission.materials.map((m) => ({
          fault_id: faultId,
          material_name: m.name,
          material_type: m.type,
          quantity: m.quantity,
          unit: m.unit,
          condition: m.condition,
          created_at: new Date().toISOString(),
        }));

        const { error: materialsError } = await supabase
          .from('water_fault_materials')
          .insert(materialsData);

        if (materialsError) {
          console.error('Materials insert error:', materialsError);
        }
      }

      // 3. Insert photos
      if (submission.photos && submission.photos.length > 0) {
        const photosData = submission.photos.map((p) => ({
          fault_id: faultId,
          photo_url: p.url,
          photo_type: p.type,
          latitude: null,
          longitude: null,
          uploaded_at: new Date().toISOString(),
        }));

        const { error: photosError } = await supabase
          .from('water_fault_photos')
          .insert(photosData);

        if (photosError) {
          console.error('Photos insert error:', photosError);
        }
      }

      // Get isolation hints for this fault
      const { data: isolationData } = await supabase.rpc('get_isolation_hints', {
        asset_number: submission.location.asset_number,
        street: submission.location.street,
        area_code: submission.location.area_code,
      });

      return noStoreJson(
        {
          ok: true,
          fault_id: faultId,
          message: 'Η βλάβη καταγράφηκε επιτυχώς',
          isolation_hints: isolationData,
          timestamp: new Date().toISOString(),
          storage: "supabase",
        },
        201
      );
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
