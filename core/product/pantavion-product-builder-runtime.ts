import fs from "node:fs";
import path from "node:path";

export type PantavionMissionRisk = "Z1" | "Z2" | "Z3" | "Z4";
export type PantavionMissionStatus =
  | "ready"
  | "needs_founder_approval"
  | "blocked"
  | "completed";

export type PantavionProductMission = {
  id: string;
  domain: string;
  title: string;
  outcome: string;
  status: PantavionMissionStatus;
  riskZone: PantavionMissionRisk;
  founderApprovalRequired: boolean;
  implementationTargets: string[];
  realProductRequirements: string[];
  blockedReasons: string[];
};

export type PantavionProductBuilderState = {
  ok: true;
  generatedAt: string;
  truthRule: string;
  missions: PantavionProductMission[];
  nextExecutableMission: PantavionProductMission | null;
};

const DATA_DIR = path.join(process.cwd(), "data", "pantavion-product-builder");
const STATE_FILE = path.join(DATA_DIR, "missions.json");

export const PANTAVION_PRODUCT_BUILDER_TRUTH_RULE =
  "Pantavion product missions must become real routes, real state, real actions, real audits and real approval gates. Static UI alone is not accepted.";

export function getPantavionDefaultProductMissions(): PantavionProductMission[] {
  return [
    {
      id: "mission_social_living_core_v1",
      domain: "social",
      title: "Social Living Core v1",
      outcome:
        "Create a real Pantavion social surface with profiles, posts, replies, contacts, basic feed state and audit trail.",
      status: "ready",
      riskZone: "Z2",
      founderApprovalRequired: false,
      implementationTargets: [
        "app/pantavion/social/page.tsx",
        "app/api/pantavion/social/posts/route.ts",
        "app/api/pantavion/social/profiles/route.ts",
        "core/social/pantavion-social-runtime.ts",
        "data/pantavion-social/social-state.json"
      ],
      realProductRequirements: [
        "real post create/read",
        "real local persisted state",
        "real profile shell",
        "real feed actions",
        "not placeholder buttons"
      ],
      blockedReasons: []
    },
    {
      id: "mission_people_contacts_import_v1",
      domain: "people",
      title: "People and Contacts Import v1",
      outcome:
        "Create a real contacts intake layer for phone/email/platform contacts with consent labels and imported-source metadata.",
      status: "needs_founder_approval",
      riskZone: "Z3",
      founderApprovalRequired: true,
      implementationTargets: [
        "app/pantavion/people/page.tsx",
        "app/api/pantavion/people/contacts/route.ts",
        "core/people/pantavion-contacts-runtime.ts"
      ],
      realProductRequirements: [
        "consent boundary",
        "source label per contact",
        "no silent scraping",
        "import preview before save"
      ],
      blockedReasons: ["contacts/privacy requires founder approval before production import"]
    },
    {
      id: "mission_chat_realtime_foundation_v1",
      domain: "chat",
      title: "Chat Runtime Foundation v1",
      outcome:
        "Create real Pantavion chat rooms/messages storage with sender, timestamps, thread state and moderation boundary.",
      status: "ready",
      riskZone: "Z2",
      founderApprovalRequired: false,
      implementationTargets: [
        "app/pantavion/chat/page.tsx",
        "app/api/pantavion/chat/messages/route.ts",
        "core/chat/pantavion-chat-runtime.ts",
        "data/pantavion-chat/chat-state.json"
      ],
      realProductRequirements: [
        "real message create/read",
        "room/thread id",
        "timestamped audit",
        "basic abuse boundary"
      ],
      blockedReasons: []
    },
    {
      id: "mission_language_runtime_250_v1",
      domain: "language",
      title: "World Language Runtime 250 v1",
      outcome:
        "Replace demo language selector with canonical 250 starter locales and app-wide language state.",
      status: "ready",
      riskZone: "Z2",
      founderApprovalRequired: false,
      implementationTargets: [
        "core/i18n/pantavion-language-runtime.ts",
        "app/api/pantavion/language/route.ts",
        "components/pantavion/PantavionLanguageRuntimeClient.tsx"
      ],
      realProductRequirements: [
        "250 starter locales",
        "manual selection",
        "auto detect fallback",
        "app shell reflects selected language"
      ],
      blockedReasons: []
    },
    {
      id: "mission_sos_runtime_boundary_v1",
      domain: "sos",
      title: "SOS Runtime Boundary v1",
      outcome:
        "Create real SOS event draft/runtime boundary with cancel window, trusted circle state and human responsibility rule.",
      status: "needs_founder_approval",
      riskZone: "Z3",
      founderApprovalRequired: true,
      implementationTargets: [
        "app/pantavion/sos/page.tsx",
        "app/api/pantavion/sos/events/route.ts",
        "core/sos/pantavion-sos-runtime.ts"
      ],
      realProductRequirements: [
        "no authority notification without contract",
        "human responsibility",
        "cancel window",
        "trusted circle only"
      ],
      blockedReasons: ["SOS safety/legal boundary requires founder approval"]
    },
    {
      id: "mission_workspaces_runtime_v1",
      domain: "workspaces",
      title: "Workspaces Runtime v1",
      outcome:
        "Create real workspace/project/task state with members, files placeholder boundary, audit and role permission model.",
      status: "ready",
      riskZone: "Z2",
      founderApprovalRequired: false,
      implementationTargets: [
        "app/pantavion/workspaces/page.tsx",
        "app/api/pantavion/workspaces/route.ts",
        "core/workspaces/pantavion-workspace-runtime.ts"
      ],
      realProductRequirements: [
        "real workspace create/read",
        "tasks",
        "roles",
        "audit trail"
      ],
      blockedReasons: []
    }
  ];
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readPantavionProductBuilderState(): PantavionProductBuilderState {
  ensureDataDir();

  if (!fs.existsSync(STATE_FILE)) {
    const missions = getPantavionDefaultProductMissions();
    const state = buildState(missions);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
    return state;
  }

  const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as PantavionProductBuilderState;
  return buildState(parsed.missions || getPantavionDefaultProductMissions());
}

export function buildState(missions: PantavionProductMission[]): PantavionProductBuilderState {
  const nextExecutableMission =
    missions.find((mission) => mission.status === "ready" && !mission.founderApprovalRequired) || null;

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    truthRule: PANTAVION_PRODUCT_BUILDER_TRUTH_RULE,
    missions,
    nextExecutableMission
  };
}

export function writePantavionProductBuilderState(
  missions: PantavionProductMission[]
): PantavionProductBuilderState {
  ensureDataDir();
  const state = buildState(missions);
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
  return state;
}
