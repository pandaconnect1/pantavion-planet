import { processEcosystemUnificationThroughKernel } from "@/core/kernel/ecosystem-unification-kernel-bridge";
import type { PantavionEcosystemDomain } from "@/core/pantaai/ecosystem/global-ecosystem-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readDomain(url: string): PantavionEcosystemDomain | undefined {
  const value = new URL(url).searchParams.get("domain");
  const allowed: readonly PantavionEcosystemDomain[] = [
    "ai_models",
    "coding_agents",
    "rag_memory",
    "workflow_automation",
    "google_full_stack_ai",
    "china_superapp",
    "seven_continent",
    "presentation",
    "video_media",
    "image_design",
    "writing_content",
    "meetings_notes",
    "voice_translation",
    "search_research",
    "knowledge_learning",
    "productivity_work",
    "tool_substitution",
    "social_community",
    "messaging_comms",
    "payments_wallet",
    "maps_mobility",
    "local_services",
    "marketplace_commerce",
    "dating_matching",
    "sos_safety",
    "identity_access",
    "legal_governance",
    "water_infrastructure",
    "cloud_ops",
    "autonomous_engineering",
  ];

  return value && allowed.includes(value as PantavionEcosystemDomain)
    ? (value as PantavionEcosystemDomain)
    : undefined;
}

export async function GET(request: Request) {
  const result = processEcosystemUnificationThroughKernel({
    requestedDomain: readDomain(request.url),
    includeChinaSuperApp: true,
    includeSevenContinents: true,
    includeProtectedKernels: true,
  });

  return Response.json(result);
}

const pantavion_ecosystem_unification_route_marker_v1 =
  "pantavion_ecosystem_unification_route_c2_v1";

