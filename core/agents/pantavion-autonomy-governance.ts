import fs from "node:fs";
import path from "node:path";

export type PantavionApprovalRisk =
  | "auth"
  | "profiles"
  | "contacts"
  | "database"
  | "messages"
  | "privacy"
  | "moderation"
  | "age_gates"
  | "notifications"
  | "abuse_controls"
  | "terms_policy"
  | "social_graph"
  | "production"
  | "secrets"
  | "dwg_source_truth"
  | "billing"
  | "unknown";

export type PantavionApprovalItem = {
  id: string;
  title: string;
  description: string;
  risk: PantavionApprovalRisk;
  zone: "Z3" | "Z4";
  status: "pending_founder_approval";
  createdAt: string;
  reason: string;
  nextSafeStep: string;
};

const ROOT = process.cwd();
const RUNTIME_DIR = path.join(ROOT, ".pantavion", "agent-runtime");
const APPROVAL_QUEUE_PATH = path.join(RUNTIME_DIR, "founder-approval-queue.json");
const APPROVAL_AUDIT_PATH = path.join(RUNTIME_DIR, "founder-approval-audit.jsonl");

const now = () => new Date().toISOString();

function ensureRuntimeDir() {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
}

function defaultQueue(): PantavionApprovalItem[] {
  const createdAt = now();

  return [
    {
      id: "approval_social_living_screen",
      title: "Pantavion Social Living Screen",
      description:
        "Live social surface with posts, people, chat, contacts, follow graph, privacy and moderation boundaries.",
      risk: "social_graph",
      zone: "Z3",
      status: "pending_founder_approval",
      createdAt,
      reason:
        "Social graph touches identity, relationships, privacy, abuse control and moderation.",
      nextSafeStep:
        "Generate scoped implementation slices without exposing private user data."
    },
    {
      id: "approval_auth_login_profiles",
      title: "Auth, Login and Profiles",
      description:
        "User accounts, profile pages, phone/email login, profile photos and account continuity.",
      risk: "auth",
      zone: "Z3",
      status: "pending_founder_approval",
      createdAt,
      reason:
        "Auth changes affect identity, security, sessions and user trust.",
      nextSafeStep:
        "Create local schema/contracts and UI placeholders before production auth."
    },
    {
      id: "approval_contacts_import",
      title: "Contacts Import",
      description:
        "Import contacts from phone, email and supported platforms with consent, source labels and duplicate handling.",
      risk: "contacts",
      zone: "Z3",
      status: "pending_founder_approval",
      createdAt,
      reason:
        "Contacts are private personal data and require consent, audit and retention rules.",
      nextSafeStep:
        "Build consent-first local contact import route and source registry."
    },
    {
      id: "approval_messages_storage",
      title: "Posts and Messages Storage",
      description:
        "Persist posts, chats, messages, reactions, media references and audit trail.",
      risk: "messages",
      zone: "Z3",
      status: "pending_founder_approval",
      createdAt,
      reason:
        "Messaging requires privacy, abuse controls, retention policy and moderation boundaries.",
      nextSafeStep:
        "Create local development storage contract before real database migration."
    },
    {
      id: "approval_terms_privacy_policy",
      title: "Terms, Privacy and Safety Policy",
      description:
        "Terms, privacy policy, report/block, age gates, moderation and abuse controls.",
      risk: "terms_policy",
      zone: "Z3",
      status: "pending_founder_approval",
      createdAt,
      reason:
        "Public platform rules affect legal exposure and user safety.",
      nextSafeStep:
        "Create founder-review policy drafts and enforcement gates."
    }
  ];
}

export function getPantavionFounderApprovalQueue() {
  ensureRuntimeDir();

  if (!fs.existsSync(APPROVAL_QUEUE_PATH)) {
    const queue = defaultQueue();
    fs.writeFileSync(APPROVAL_QUEUE_PATH, JSON.stringify(queue, null, 2) + "\n", "utf8");
    return queue;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(APPROVAL_QUEUE_PATH, "utf8"));
    return Array.isArray(parsed) ? (parsed as PantavionApprovalItem[]) : defaultQueue();
  } catch {
    const queue = defaultQueue();
    fs.writeFileSync(APPROVAL_QUEUE_PATH, JSON.stringify(queue, null, 2) + "\n", "utf8");
    return queue;
  }
}

export function recordPantavionFounderApproval(input: {
  itemId: string;
  decision: "approved" | "blocked";
  actor?: string;
  note?: string;
}) {
  ensureRuntimeDir();

  const record = {
    id: `founder_decision_${Date.now()}`,
    itemId: input.itemId,
    decision: input.decision,
    actor: input.actor || "founder",
    note: input.note || "",
    createdAt: now(),
    truthRule:
      "Risk actions are never executed silently. Founder approval is recorded before future execution."
  };

  fs.appendFileSync(APPROVAL_AUDIT_PATH, JSON.stringify(record) + "\n", "utf8");

  return record;
}

export function getPantavionApprovalDashboardSnapshot() {
  const queue = getPantavionFounderApprovalQueue();

  return {
    ok: true,
    route: "/api/pantavion/agents/runtime/approvals",
    page: "/pantavion/agents/approvals",
    generatedAt: now(),
    pendingCount: queue.length,
    queue,
    safety: {
      safeActionsMayRunAutomatically: true,
      riskyActionsRequireFounderApproval: true,
      productionDeployBlocked: true,
      secretsBlocked: true,
      destructiveRepoActionsBlocked: true,
      dwgSourceTruthBlockedWithoutExplicitApproval: true
    },
    doctrine:
      "Pantavion may generate safe scoped implementation code automatically. Z3/Z4 actions enter founder approval before execution."
  };
}
