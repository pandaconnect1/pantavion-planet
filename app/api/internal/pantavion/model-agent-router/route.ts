import {
  routePantavionAgentTask,
  type PantavionAgentTaskKind,
} from "@/core/pantaai/model-router/agent-task-router";
import {
  advisePantavionToolSubstitution,
  type PantavionToolNeed,
  type PantavionPreference,
} from "@/core/pantaai/tool-substitution/tool-substitution-advisor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TASK_KINDS: readonly PantavionAgentTaskKind[] = [
  "answer",
  "research",
  "write_code",
  "repair_build",
  "translate_live",
  "create_media",
  "create_presentation",
  "workflow_automation",
  "china_superapp_module",
  "seven_continent_localization",
  "protected_domain_kernel",
];

const TOOL_NEEDS: readonly PantavionToolNeed[] = [
  "presentation",
  "video",
  "image",
  "writing",
  "meeting_notes",
  "voice",
  "research",
  "workflow",
  "coding",
  "search",
  "social",
  "commerce",
  "maps",
  "dating",
  "translation",
  "knowledge",
  "productivity",
];

function asTaskKind(value: string | null): PantavionAgentTaskKind {
  return value && TASK_KINDS.includes(value as PantavionAgentTaskKind)
    ? (value as PantavionAgentTaskKind)
    : "write_code";
}

function asToolNeed(value: string | null): PantavionToolNeed {
  return value && TOOL_NEEDS.includes(value as PantavionToolNeed)
    ? (value as PantavionToolNeed)
    : "coding";
}

function asPreference(value: string | null): PantavionPreference | undefined {
  const allowed: readonly PantavionPreference[] = [
    "fast",
    "cheap",
    "advanced",
    "private",
    "free_first",
    "provider_best",
    "internal_first",
  ];

  return value && allowed.includes(value as PantavionPreference)
    ? (value as PantavionPreference)
    : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const goal =
    url.searchParams.get("goal") ??
    "Unify Pantavion ecosystems and generate continuous autonomous coding work.";
  const kind = asTaskKind(url.searchParams.get("kind"));
  const need = asToolNeed(url.searchParams.get("need"));
  const preference = asPreference(url.searchParams.get("preference"));

  const agentRoute = routePantavionAgentTask({
    goal,
    kind,
    sensitivity: kind === "protected_domain_kernel" ? "protected" : "internal",
  });

  const substitution = advisePantavionToolSubstitution({
    need,
    preference,
    sensitivity: kind === "protected_domain_kernel" ? "protected" : "internal",
  });

  return Response.json({
    ok: true,
    route: agentRoute,
    substitution,
    marker: "pantavion_model_agent_router_route_c3_v1",
  });
}

const pantavion_model_agent_router_route_marker_v1 =
  "pantavion_model_agent_router_route_c3_v1";

