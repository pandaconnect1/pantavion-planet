import { NextResponse } from "next/server";
import {
  getPantavionCapabilityRegistry,
  summarizePantavionCapabilities
} from "../../../../core/capabilities/pantavion-capability-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/capabilities",
    summary: summarizePantavionCapabilities(),
    registry: getPantavionCapabilityRegistry()
  });
}

export async function POST(request: Request) {
  let body: { query?: string } = {};

  try {
    body = (await request.json()) as { query?: string };
  } catch {
    body = {};
  }

  const query = String(body.query || "").toLowerCase();

  const registry = getPantavionCapabilityRegistry();
  const matches = registry.capabilities.filter((capability) => {
    const haystack = [
      capability.id,
      capability.title,
      capability.domain,
      capability.status,
      capability.routeTargets.join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return query ? haystack.includes(query) : true;
  });

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/capabilities",
    query,
    count: matches.length,
    matches
  });
}
