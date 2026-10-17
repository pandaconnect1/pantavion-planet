import { NextResponse } from "next/server";

import {
  createIncidentRecord,
  dispatchIncident,
} from "@/lib/incidents/service";

type CheckState = "ok" | "degraded" | "failed";

interface HealthCheck {
  name: string;
  state: CheckState;
  message?: string;
}

export const dynamic = "force-dynamic";

function checkEnvironment(): HealthCheck {
  const missing = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter((name) => !process.env[name]);

  if (missing.length === 0) {
    return { name: "configuration", state: "ok" };
  }

  return {
    name: "configuration",
    state: "failed",
    message: `Missing required variables: ${missing.join(", ")}`,
  };
}

export async function GET() {
  const checks: HealthCheck[] = [checkEnvironment()];
  const failed = checks.filter((check) => check.state === "failed");
  const degraded = checks.filter((check) => check.state === "degraded");
  const status: CheckState = failed.length
    ? "failed"
    : degraded.length
      ? "degraded"
      : "ok";

  if (status !== "ok") {
    const incident = createIncidentRecord({
      severity: status === "failed" ? "P1" : "P2",
      module: "platform",
      summary: "Health check detected an unhealthy runtime state",
      details: checks
        .filter((check) => check.state !== "ok")
        .map((check) => `${check.name}: ${check.message ?? check.state}`)
        .join("; "),
      fallbackState: "Health endpoint remains available",
      actionRequired: status === "failed",
      fingerprint: `health:${checks
        .map((check) => `${check.name}:${check.state}`)
        .join("|")}`,
    });

    await dispatchIncident(incident);
  }

  return NextResponse.json(
    {
      service: "pantavion",
      status,
      checkedAt: new Date().toISOString(),
      checks,
    },
    {
      status: status === "failed" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
