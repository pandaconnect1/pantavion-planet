import "server-only";

import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import {
  authorizeWaterValveFieldAction,
} from "@/core/infrastructure/water/water-valve-operational-authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  return NextResponse.json(body, { ...init, headers });
}

/**
 * Authorization boundary for real-world valve field-state writes.
 *
 * Important:
 * - map/device approval alone is deliberately insufficient;
 * - this route does not mutate a valve or the network;
 * - Founder/Water Admin is the first supported verified actor path;
 * - verified field/supervisor identities are added only after a durable role store exists.
 */
export async function POST(request: Request) {
  const privileged = await hasWaterAdminAuthorization(request);

  const authorization = authorizeWaterValveFieldAction(
    privileged
      ? {
          actorId: "pantavion-privileged-session",
          role: "ADMIN",
          identityVerified: true,
          active: true,
        }
      : null,
  );

  if (!authorization.ok) {
    return noStore(
      {
        ok: false,
        authorized: false,
        error: "valve_operational_authorization_required",
      },
      { status: 403 },
    );
  }

  return noStore({
    ok: true,
    authorized: true,
    actor: {
      actorId: authorization.actorId,
      role: authorization.role,
    },
    permissions: {
      mayConfirmValveFieldState: true,
      mayOperatePhysicalValveRemotely: false,
      mayMutateAuthenticNetworkGeometry: false,
    },
  });
}
