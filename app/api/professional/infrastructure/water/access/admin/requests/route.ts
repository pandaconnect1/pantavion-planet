import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import { listWaterAccessRequests } from "@/core/water/water-access-store";

function normalizePhone(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[\s().-]/g, "")
    : "";
}

export async function POST(request: Request) {
  try {
    if (!(await hasWaterAdminAuthorization(request))) {
      return NextResponse.json(
        { ok: false, error: "admin_session_required" },
        { status: 403 },
      );
    }

    const rows = await listWaterAccessRequests(200);
    const historyRecords = rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      title: row.title,
      organization: row.organization,
      emailOrPhone: normalizePhone(row.email_or_phone),
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      attemptCount: row.attempt_count,
      deviceId: row.device_id,
      deviceLabel: row.device_label,
      hasDeviceToken: Boolean(row.token_hash),
    }));

    const rawPendingRecords = historyRecords.filter(
      (item) => item.status === "pending_founder_review",
    );

    return NextResponse.json({
      ok: true,
      requests: rawPendingRecords,
      pendingRequests: rawPendingRecords,
      readCount: historyRecords.length,
      skippedCount: 0,
      storage: "supabase",
      summary: {
        newPendingCount: rawPendingRecords.length,
        rawPendingAttemptCount: rawPendingRecords.length,
        historicalAttemptCount: historyRecords.length,
        uniqueHistoricalPeopleCount: historyRecords.length,
        duplicateHistoricalAttemptCount: 0,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "requests_failed",
      },
      { status: 500 },
    );
  }
}
