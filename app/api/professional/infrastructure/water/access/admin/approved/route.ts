import { NextResponse } from "next/server";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";
import { listWaterApprovedDevices } from "@/core/water/water-access-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasWaterAdminSession(request)) {
    return NextResponse.json(
      { ok: false, error: "admin_session_required" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const rows = await listWaterApprovedDevices(1000);

    const normalize = (row: (typeof rows)[number]) => ({
      id: row.device_id,
      deviceId: row.device_id,
      requestId: row.request_id || "",
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      roleTitle: row.title,
      title: row.title,
      status: row.status,
      approvedAt: row.approved_at,
      revokedAt: row.revoked_at || "",
      revoked: row.revoked,
      updatedAt: row.updated_at,
      sourcePath: "supabase:water_approved_devices",
    });

    const approvedUsers = rows
      .filter((row) => row.status === "approved" && !row.revoked)
      .map(normalize);
    const blockedUsers = rows
      .filter((row) => row.status === "revoked" || row.revoked)
      .map(normalize);

    return NextResponse.json(
      {
        ok: true,
        approvedUsers,
        approvedDevices: approvedUsers,
        blockedUsers,
        revokedUsers: blockedUsers,
        count: approvedUsers.length,
        blockedCount: blockedUsers.length,
        storage: "supabase",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "approved_users_failed",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
