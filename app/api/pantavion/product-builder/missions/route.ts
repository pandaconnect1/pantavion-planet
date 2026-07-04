import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MissionRisk = "Z1" | "Z2" | "Z3" | "Z4";
type MissionStatus =
  | "ready"
  | "running"
  | "approval_required"
  | "approval_requested"
  | "approved"
  | "completed"
  | "blocked";

type MissionAction =
  | "select"
  | "start"
  | "request_approval"
  | "approve"
  | "complete"
  | "block"
  | "reset";

type ProductBuilderMission = {
  id: string;
  title: string;
  domain: string;
  description: string;
  risk: MissionRisk;
  status: MissionStatus;
  founderApprovalRequired: boolean;
  targetRoutes: string[];
  targetFiles: string[];
  truthRule: string;
  lastDecision?: string;
  updatedAt: string;
};

type ProductBuilderAudit = {
  id: string;
  at: string;
  missionId: string;
  action: MissionAction;
  result: string;
  actor: "founder" | "system";
};

type ProductBuilderStore = {
  ok: true;
  id: "pantavion_product_builder_mission_queue_v1";
  updatedAt: string;
  selectedMissionId: string | null;
  missions: ProductBuilderMission[];
  audit: ProductBuilderAudit[];
};

const PANTAVION_PRODUCT_BUILDER_API_ROUTE = "/api/pantavion/product-builder/missions";
const STORE_PATH = path.join(process.cwd(), "data", "pantavion-product-builder", "missions.json");

function now() {
  return new Date().toISOString();
}

function defaultMissions(): ProductBuilderMission[] {
  const t = now();

  return [
    {
      id: "social_living_core_v1",
      title: "Social Living Core v1",
      domain: "social",
      description:
        "Real social foundation: people, posts, comments, follows, feed actions, privacy boundaries and audit state.",
      risk: "Z2",
      status: "ready",
      founderApprovalRequired: false,
      targetRoutes: ["/pantavion/social", "/api/pantavion/social"],
      targetFiles: [
        "core/social/pantavion-social-runtime.ts",
        "app/api/pantavion/social/route.ts",
        "app/pantavion/social/page.tsx",
        "components/pantavion/PantavionSocialClient.tsx"
      ],
      truthRule:
        "No fake social UI. Every button must read/write state through API routes and audit records.",
      updatedAt: t
    },
    {
      id: "people_contacts_core_v1",
      title: "People / Contacts Core v1",
      domain: "people",
      description:
        "Real contacts and people layer: profiles, imported contact records, source labels, privacy and duplicate-safe boundaries.",
      risk: "Z3",
      status: "approval_required",
      founderApprovalRequired: true,
      targetRoutes: ["/pantavion/people", "/api/pantavion/people"],
      targetFiles: [
        "core/people/pantavion-people-runtime.ts",
        "app/api/pantavion/people/route.ts",
        "app/pantavion/people/page.tsx"
      ],
      truthRule:
        "Contacts and identity are sensitive. Founder approval required before real import or identity mutation.",
      updatedAt: t
    },
    {
      id: "chat_inbox_core_v1",
      title: "Chat / Unified Inbox Core v1",
      domain: "chat",
      description:
        "Real chat foundation: conversations, messages, unread state, inbox filters, moderation boundaries and audit.",
      risk: "Z2",
      status: "ready",
      founderApprovalRequired: false,
      targetRoutes: ["/pantavion/chat", "/api/pantavion/chat"],
      targetFiles: [
        "core/chat/pantavion-chat-runtime.ts",
        "app/api/pantavion/chat/route.ts",
        "app/pantavion/chat/page.tsx"
      ],
      truthRule:
        "Chat cannot be static. Messages must persist through a runtime store and API.",
      updatedAt: t
    },
    {
      id: "language_runtime_full_v1",
      title: "Language Runtime Full v1",
      domain: "language",
      description:
        "Real language layer: manual language selection, persisted locale, app-wide dictionary keys and future provider translation boundary.",
      risk: "Z2",
      status: "running",
      founderApprovalRequired: false,
      targetRoutes: ["/api/pantavion/language"],
      targetFiles: [
        "core/i18n/pantavion-language-runtime.ts",
        "components/pantavion/PantavionLanguageRuntimeClient.tsx",
        "app/api/pantavion/language/route.ts"
      ],
      truthRule:
        "Language selection must affect real UI labels where keys exist. Missing translations must be visible, not faked.",
      updatedAt: t
    },
    {
      id: "workspaces_core_v1",
      title: "Workspaces Core v1",
      domain: "workspaces",
      description:
        "Real workspace layer: projects, tasks, files, members, permissions, activity log and agent execution boundaries.",
      risk: "Z3",
      status: "approval_required",
      founderApprovalRequired: true,
      targetRoutes: ["/pantavion/workspaces", "/api/pantavion/workspaces"],
      targetFiles: [
        "core/workspaces/pantavion-workspace-runtime.ts",
        "app/api/pantavion/workspaces/route.ts",
        "app/pantavion/workspaces/page.tsx"
      ],
      truthRule:
        "Workspace writes affect user data and permissions. Founder approval required before production-grade mutation.",
      updatedAt: t
    },
    {
      id: "sos_runtime_core_v1",
      title: "SOS Runtime Core v1",
      domain: "sos",
      description:
        "Real SOS foundation: emergency event, trusted contacts, cancel window, audit, disclaimers and provider boundaries.",
      risk: "Z4",
      status: "approval_required",
      founderApprovalRequired: true,
      targetRoutes: ["/pantavion/sos", "/api/pantavion/sos"],
      targetFiles: [
        "core/sos/pantavion-sos-runtime.ts",
        "app/api/pantavion/sos/route.ts",
        "app/pantavion/sos/page.tsx"
      ],
      truthRule:
        "SOS cannot pretend emergency authority. Human responsibility, audit and legal boundaries are mandatory.",
      updatedAt: t
    }
  ];
}

function ensureStore(): ProductBuilderStore {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });

  if (!fs.existsSync(STORE_PATH)) {
    const store: ProductBuilderStore = {
      ok: true,
      id: "pantavion_product_builder_mission_queue_v1",
      updatedAt: now(),
      selectedMissionId: "social_living_core_v1",
      missions: defaultMissions(),
      audit: []
    };

    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
    return store;
  }

  const raw = fs.readFileSync(STORE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<ProductBuilderStore>;

  return {
    ok: true,
    id: "pantavion_product_builder_mission_queue_v1",
    updatedAt: parsed.updatedAt || now(),
    selectedMissionId: parsed.selectedMissionId || "social_living_core_v1",
    missions: Array.isArray(parsed.missions) ? parsed.missions : defaultMissions(),
    audit: Array.isArray(parsed.audit) ? parsed.audit : []
  };
}

function writeStore(store: ProductBuilderStore) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  store.updatedAt = now();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function publicState(store: ProductBuilderStore) {
  const nextExecutableMission =
    store.missions.find(
      (mission) => mission.status === "ready" && !mission.founderApprovalRequired
    ) || null;

  const approvalQueue = store.missions.filter(
    (mission) =>
      mission.founderApprovalRequired &&
      (mission.status === "approval_required" || mission.status === "approval_requested")
  );

  return {
    ok: true,
    route: PANTAVION_PRODUCT_BUILDER_API_ROUTE,
    generatedAt: now(),
    selectedMissionId: store.selectedMissionId,
    nextExecutableMission,
    approvalQueue,
    missions: store.missions,
    auditTail: store.audit.slice(-20),
    truthRule:
      "Product builder reads and writes real runtime state. Risky missions require founder approval before execution."
  };
}

function normalizeAction(action: unknown): MissionAction {
  const allowed: MissionAction[] = [
    "select",
    "start",
    "request_approval",
    "approve",
    "complete",
    "block",
    "reset"
  ];

  if (typeof action === "string" && allowed.includes(action as MissionAction)) {
    return action as MissionAction;
  }

  return "select";
}

function addAudit(
  store: ProductBuilderStore,
  missionId: string,
  action: MissionAction,
  result: string
) {
  store.audit.push({
    id: `audit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    at: now(),
    missionId,
    action,
    result,
    actor: "founder"
  });

  store.audit = store.audit.slice(-100);
}

export async function GET() {
  const store = ensureStore();
  return NextResponse.json(publicState(store));
}

export async function POST(request: Request) {
  const store = ensureStore();
  const body = (await request.json().catch(() => ({}))) as {
    missionId?: string;
    action?: string;
  };

  const missionId = body.missionId || store.selectedMissionId || "";
  const action = normalizeAction(body.action);
  const mission = store.missions.find((item) => item.id === missionId);

  if (!mission) {
    return NextResponse.json(
      {
        ok: false,
        error: "mission_not_found",
        route: PANTAVION_PRODUCT_BUILDER_API_ROUTE
      },
      { status: 404 }
    );
  }

  store.selectedMissionId = mission.id;

  if (action === "select") {
    mission.lastDecision = "Selected for review.";
    addAudit(store, mission.id, action, "selected");
  }

  if (action === "request_approval") {
    mission.status = "approval_requested";
    mission.lastDecision = "Founder approval requested.";
    addAudit(store, mission.id, action, "approval_requested");
  }

  if (action === "approve") {
    mission.status = "approved";
    mission.lastDecision = "Founder approved this mission for next controlled execution.";
    addAudit(store, mission.id, action, "approved");
  }

  if (action === "start") {
    if (mission.founderApprovalRequired && mission.status !== "approved") {
      mission.status = "approval_requested";
      mission.lastDecision = "Start blocked until founder approval.";
      addAudit(store, mission.id, action, "blocked_pending_approval");
    } else {
      mission.status = "running";
      mission.lastDecision =
        "Mission moved to running. Code generation must happen through safe patch runner and audits.";
      addAudit(store, mission.id, action, "running");
    }
  }

  if (action === "complete") {
    mission.status = "completed";
    mission.lastDecision = "Mission marked completed after verified implementation.";
    addAudit(store, mission.id, action, "completed");
  }

  if (action === "block") {
    mission.status = "blocked";
    mission.lastDecision = "Mission blocked by founder.";
    addAudit(store, mission.id, action, "blocked");
  }

  if (action === "reset") {
    mission.status = mission.founderApprovalRequired ? "approval_required" : "ready";
    mission.lastDecision = "Mission reset to safe queue state.";
    addAudit(store, mission.id, action, "reset");
  }

  mission.updatedAt = now();
  writeStore(store);

  return NextResponse.json(publicState(store));
}
