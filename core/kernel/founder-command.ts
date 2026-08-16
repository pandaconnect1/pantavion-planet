import crypto from "node:crypto";
import { callPantavionAI } from "../ai/provider-router";
import { classifyExecution, type SafetyVerdict } from "../runtime/execution-safety";
import { appendKernelAudit } from "./kernel-audit";
import {
  appendFounderCommand,
  getFounderCommand,
  listFounderCommands,
  updateFounderCommand,
  type FounderCommandIntent,
  type FounderCommandPlan,
  type FounderCommandRecord,
  type FounderCommandSource,
  type FounderCommandStatus,
} from "./founder-command-store";

export {
  getFounderCommand,
  listFounderCommands,
  updateFounderCommand,
  type FounderCommandRecord,
};

function classifyFounderIntent(commandText: string): FounderCommandIntent {
  const text = commandText.toLowerCase();

  if (
    text.includes("startup") ||
    text.includes("company") ||
    text.includes("business") ||
    text.includes("εταιρ") ||
    text.includes("νεοφυ")
  ) {
    return "startup_builder";
  }

  if (
    text.includes("kernel") ||
    text.includes("κερνελ") ||
    text.includes("αυτοαναβα") ||
    text.includes("self") ||
    text.includes("evolution") ||
    text.includes("upgrade")
  ) {
    return "kernel_upgrade";
  }

  if (
    text.includes("repo") ||
    text.includes("git") ||
    text.includes("patch") ||
    text.includes("pr") ||
    text.includes("branch") ||
    text.includes("file")
  ) {
    return "repo_change";
  }

  if (
    text.includes("safety") ||
    text.includes("audit") ||
    text.includes("approval") ||
    text.includes("security") ||
    text.includes("ασφαλ")
  ) {
    return "runtime_safety";
  }

  if (
    text.includes("water") ||
    text.includes("dwg") ||
    text.includes("ύδρευση") ||
    text.includes("νερό") ||
    text.includes("map")
  ) {
    return "water_infrastructure";
  }

  if (
    text.includes("voice") ||
    text.includes("φων") ||
    text.includes("μιλώ") ||
    text.includes("μιλαω")
  ) {
    return "voice_command";
  }

  return "unknown";
}

function statusFromVerdict(verdict: SafetyVerdict): FounderCommandStatus {
  if (verdict.zone === "Z4_BLOCKED_MANUAL_ONLY") {
    return "blocked";
  }

  if (verdict.founderApprovalRequired) {
    return "awaiting_founder_approval";
  }

  if (verdict.reviewRequired) {
    return "ready_for_evolution_pr";
  }

  return "planned";
}

function executionModeFromVerdict(
  verdict: SafetyVerdict,
): FounderCommandPlan["executionMode"] {
  if (verdict.zone === "Z4_BLOCKED_MANUAL_ONLY") {
    return "blocked_manual_only";
  }

  if (verdict.founderApprovalRequired) {
    return "blocked_pending_founder_approval";
  }

  if (verdict.reviewRequired) {
    return "can_open_evolution_pr_after_checks";
  }

  return "proposal_only";
}

function buildRequiredRoutes(intent: FounderCommandIntent): string[] {
  const base = [
    "/api/kernel/founder-command",
    "/api/kernel/evolution/propose",
    "/api/kernel/evolution/actions",
  ];

  if (intent === "startup_builder") {
    return [...base, "/api/kernel/startup-builder"];
  }

  if (intent === "kernel_upgrade" || intent === "repo_change") {
    return [...base, "/api/kernel/tick"];
  }

  if (intent === "voice_command") {
    return [...base, "voice route not implemented yet - must stay disabled/internal"];
  }

  return base;
}

function buildPlan(input: {
  intent: FounderCommandIntent;
  verdict: SafetyVerdict;
  aiProviderStatus: string;
  aiPlanText?: string;
}): FounderCommandPlan {
  const requiredChecks = [
    "npm run build",
    "npx tsc --noEmit --pretty false",
    "npm run kernel:tick",
    "founder approval for Z3/Z4",
  ];

  return {
    summary:
      "Founder command captured as a governed Pantavion kernel/evolution instruction.",
    intent: input.intent,
    executionMode: executionModeFromVerdict(input.verdict),
    requiredRoutes: buildRequiredRoutes(input.intent),
    requiredState: [
      ".pantavion/kernel/founder-commands.json",
      ".pantavion/kernel/audit.jsonl",
      ".pantavion/kernel/state.json",
    ],
    requiredScripts: [
      "scripts/pantavion-kernel-tick.cjs",
      "scripts/pantavion-evolution-pr-writer.cjs",
      "scripts/pantavion-apply-command-pack.cjs",
    ],
    requiredChecks,
    nextAction:
      input.verdict.zone === "Z4_BLOCKED_MANUAL_ONLY"
        ? "Manual founder approval and exact scoped patch are required before any execution."
        : input.verdict.founderApprovalRequired
          ? "Founder approval is required before converting this command into a PR or production action."
          : "Convert this command into a scoped Z1/Z2 evolution PR only after green checks.",
    aiProviderStatus: input.aiProviderStatus,
    aiPlanText: input.aiPlanText,
  };
}

export async function createFounderCommand(input: {
  commandText: string;
  actor?: string;
  source?: FounderCommandSource;
  useAI?: boolean;
}): Promise<FounderCommandRecord> {
  const commandText = String(input.commandText ?? "").trim();

  if (commandText.length < 3) {
    throw new Error("Founder command is too short.");
  }

  const actor = input.actor ?? "founder";
  const source = input.source ?? "api";
  const intent = classifyFounderIntent(commandText);

  const verdict = classifyExecution({
    actor,
    action: `founder command: ${commandText}`,
  });

  let aiProviderStatus = "not_requested";
  let aiPlanText: string | undefined;

  if (input.useAI) {
    const ai = await callPantavionAI({
      system: [
        "You are Pantavion Founder Command Planner.",
        "Convert founder instructions into implementation-ready plans.",
        "No fake features. Every proposed capability must include route, logic, state/data flow, provider/source when needed, disabled/internal status, checks, audit, and approval zone.",
        "Do not claim production execution unless build/typecheck/audit are green and founder approval exists for sensitive actions.",
      ].join("\n"),
      prompt: [
        "Founder command:",
        commandText,
        "",
        "Return a concise execution plan with:",
        "1. Intent",
        "2. Real files/routes/scripts needed",
        "3. State/data flow",
        "4. Safety zone",
        "5. Build/typecheck/audit gates",
        "6. Founder approval needs",
      ].join("\n"),
    });

    if (ai.ok) {
      aiProviderStatus = `${ai.provider}:${ai.model}`;
      aiPlanText = ai.text;
    } else {
      aiProviderStatus = `${ai.provider}:${ai.status}:${ai.message}`;
    }
  }

  const plan = buildPlan({
    intent,
    verdict,
    aiProviderStatus,
    aiPlanText,
  });

  const now = new Date().toISOString();

  const record: FounderCommandRecord = {
    id: crypto.randomUUID(),
    version: 1,
    createdAt: now,
    updatedAt: now,
    actor,
    source,
    commandText,
    status: statusFromVerdict(verdict),
    intent,
    safetyVerdict: verdict,
    plan,
  };

  await appendFounderCommand(record);

  await appendKernelAudit({
    id: crypto.randomUUID(),
    type: "founder.command.created",
    actor,
    createdAt: new Date().toISOString(),
    payload: {
      commandId: record.id,
      source,
      intent,
      status: record.status,
      zone: verdict.zone,
      approvalRequired: verdict.founderApprovalRequired,
      aiProviderStatus,
    },
  });

  return record;
}

export async function approveFounderCommand(input: {
  commandId: string;
  actor: string;
  note?: string;
}): Promise<FounderCommandRecord | null> {
  const updated = await updateFounderCommand(input.commandId, (record) => ({
    ...record,
    status:
      record.safetyVerdict.zone === "Z4_BLOCKED_MANUAL_ONLY"
        ? "blocked"
        : "ready_for_evolution_pr",
    founderApproval: {
      approved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: input.actor,
      note: input.note,
    },
  }));

  if (updated) {
    await appendKernelAudit({
      id: crypto.randomUUID(),
      type: "founder.command.approved",
      actor: input.actor,
      createdAt: new Date().toISOString(),
      payload: {
        commandId: updated.id,
        status: updated.status,
        zone: updated.safetyVerdict.zone,
      },
    });
  }

  return updated;
}
