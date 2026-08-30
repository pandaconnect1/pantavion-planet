import { NextResponse } from "next/server";

import { evaluatePrivilegedRequestBoundary } from "@/core/security/privileged-request-boundary";

/**
 * Shared fail-closed boundary for Founder-cookie-authorized Kernel mutations.
 *
 * Authorization remains a separate mandatory check in every route. This guard
 * rejects cross-site, cross-origin, missing-Origin and non-JSON mutations before
 * any Founder-owned state can be changed.
 */
export function enforcePantavionKernelPrivilegedMutationBoundary(
  request: Request,
): NextResponse | null {
  const decision = evaluatePrivilegedRequestBoundary(request);
  if (decision.allowed) return null;

  const response = NextResponse.json(
    {
      ok: false,
      marker: "pantavion_kernel_mutation_boundary_denied_v1",
      status: "restricted",
      reason: decision.reason,
    },
    {
      status: decision.reason === "json_required" ? 415 : 403,
    },
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
