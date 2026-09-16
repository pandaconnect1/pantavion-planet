import "server-only";

import { generateText } from "ai";
import {
  claimPantavionRecoveryAgentBundleViaOidc,
  finishPantavionRecoveryAgentBundleViaOidc,
  heartbeatPantavionRecoveryAgentBundleViaOidc,
  type PantavionRecoveryAgentBundleClaim,
} from "@/lib/supabase/oidc-agent-bundle-bridge";

const DEFAULT_MODEL = "openai/gpt-5.6-sol";
const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 6;

export type PantavionRecoveryAgentBundleTickReport = {
  marker: "pantavion_recovery_agent_bundle_tick_v1";
  status: "ran" | "idle" | "degraded";
  attempted: number;
  succeeded: number;
  retried: number;
  failedToFinish: number;
  model: string;
  executionMode: "vercel_ai_gateway_oidc";
  authority: {
    productionWrite: false;
    merge: false;
    deployment: false;
    publicRelease: false;
    rawRecoveryPayloadExport: false;
  };
  checkedAt: string;
};

type RecoveryAgentPlan = {
  summary: string;
  diagnosis: string;
  implementationPlan: string[];
  tests: string[];
  gaps: string[];
  blockers: Array<{ kind: string; summary: string }>;
  confidence: number;
};

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function cleanStringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => cleanString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(withoutFence);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function validatePlan(value: Record<string, unknown> | null): RecoveryAgentPlan | null {
  if (!value) return null;
  const summary = cleanString(value.summary, 1800);
  const diagnosis = cleanString(value.diagnosis, 2400);
  const implementationPlan = cleanStringArray(value.implementationPlan, 12, 700);
  const tests = cleanStringArray(value.tests, 10, 500);
  const gaps = cleanStringArray(value.gaps, 10, 500);
  const rawBlockers = Array.isArray(value.blockers) ? value.blockers : [];
  const blockers = rawBlockers
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      const kind = cleanString(record.kind, 80);
      const blockerSummary = cleanString(record.summary, 500);
      return kind && blockerSummary ? { kind, summary: blockerSummary } : null;
    })
    .filter((item): item is { kind: string; summary: string } => Boolean(item))
    .slice(0, 8);
  const confidence = Number(value.confidence);

  if (!summary || !diagnosis || implementationPlan.length === 0 || tests.length === 0) return null;
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) return null;

  return {
    summary,
    diagnosis,
    implementationPlan,
    tests,
    gaps,
    blockers,
    confidence,
  };
}

function buildPrompt(claim: PantavionRecoveryAgentBundleClaim) {
  const bundle = claim.input ?? {};
  const evidence = claim.evidence ?? {};
  return [
    "You are Pantavion Recovery Engineering Agent.",
    "Analyze one canonical recovery bundle and produce an evidence-bound internal engineering plan.",
    "Do not claim that code, tests, deployment, or live verification already happened.",
    "Do not invent source evidence that is not present in the supplied sanitized metadata.",
    "Do not request or expose passwords, API keys, tokens, credentials, private user data, or raw recovery payloads.",
    "Do not authorize merge, deployment, production business-data writes, public release, or external messages.",
    "The output will be stored as an internal work artifact and later consumed by bounded builder/verifier agents.",
    "Return ONLY valid JSON with exactly these keys:",
    '{"summary":"string","diagnosis":"string","implementationPlan":["step"],"tests":["test"],"gaps":["gap"],"blockers":[{"kind":"string","summary":"string"}],"confidence":0.0}',
    "Confidence must be between 0 and 1.",
    "Bundle metadata:",
    JSON.stringify(bundle),
    "Sanitized evidence summary:",
    JSON.stringify(evidence),
  ].join("\n");
}

async function executeClaim(claim: PantavionRecoveryAgentBundleClaim, model: string) {
  if (
    claim.claimed !== true ||
    !claim.executionId ||
    !claim.ownerId ||
    !Number.isSafeInteger(claim.fencingToken) ||
    (claim.fencingToken ?? 0) < 1 ||
    !claim.input ||
    !claim.evidence ||
    claim.authority?.productionWrite !== false ||
    claim.authority?.merge !== false ||
    claim.authority?.deployment !== false ||
    claim.authority?.publicRelease !== false ||
    claim.authority?.rawRecoveryPayloadExport !== false
  ) {
    throw new Error("recovery_agent_bundle_claim_invalid");
  }

  const executionId = claim.executionId;
  const ownerId = claim.ownerId;
  const fencingToken = claim.fencingToken as number;

  try {
    const result = await generateText({
      model,
      prompt: buildPrompt(claim),
      temperature: 0,
      maxOutputTokens: 2200,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(75_000),
      providerOptions: {
        gateway: {
          tags: ["pantavion:recovery", "pantavion:agent-bundle", "env:production"],
        },
      },
    });

    await heartbeatPantavionRecoveryAgentBundleViaOidc({
      executionId,
      ownerId,
      fencingToken,
    });

    const plan = validatePlan(parseJsonObject(result.text));
    if (!plan) throw new Error("recovery_agent_bundle_ai_output_invalid");

    const output: Record<string, unknown> = {
      marker: "pantavion_recovery_agent_bundle_ai_plan_v1",
      model,
      bundleKey: claim.input.bundleKey ?? null,
      canonicalTarget: claim.input.canonicalTarget ?? null,
      taskType: claim.input.taskType ?? null,
      priority: claim.input.priority ?? null,
      module: claim.input.module ?? null,
      subsystem: claim.input.subsystem ?? null,
      capability: claim.input.capability ?? null,
      feature: claim.input.feature ?? null,
      contentType: claim.input.contentType ?? null,
      evidenceRecordCount: claim.input.evidenceRecordCount ?? null,
      evidenceSummary: claim.evidence,
      plan,
      authority: claim.authority,
      generatedAt: new Date().toISOString(),
      completionTruth: "AI_PLAN_GENERATED_NOT_IMPLEMENTED",
    };

    await finishPantavionRecoveryAgentBundleViaOidc({
      executionId,
      ownerId,
      fencingToken,
      succeeded: true,
      output,
    });
    return "succeeded" as const;
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 240) : "recovery_agent_bundle_runtime_failed";
    try {
      await finishPantavionRecoveryAgentBundleViaOidc({
        executionId,
        ownerId,
        fencingToken,
        succeeded: false,
        error: errorCode,
      });
      return "retried" as const;
    } catch {
      return "failed_to_finish" as const;
    }
  }
}

function ownerId(index: number) {
  return `vercel-recovery-agent:${Date.now()}:${index}:${crypto.randomUUID()}`;
}

export async function runPantavionRecoveryAgentBundleTick(input?: {
  limit?: number;
}): Promise<PantavionRecoveryAgentBundleTickReport> {
  const checkedAt = new Date().toISOString();
  const requestedLimit = input?.limit ?? DEFAULT_LIMIT;
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(requestedLimit)));
  const model = process.env.PANTAVION_RECOVERY_AGENT_MODEL?.trim() || DEFAULT_MODEL;
  const claims: PantavionRecoveryAgentBundleClaim[] = [];

  for (let index = 0; index < limit; index += 1) {
    const claim = await claimPantavionRecoveryAgentBundleViaOidc({
      ownerId: ownerId(index),
      leaseSeconds: 180,
    });
    if (!claim.claimed) break;
    claims.push(claim);
  }

  if (claims.length === 0) {
    return {
      marker: "pantavion_recovery_agent_bundle_tick_v1",
      status: "idle",
      attempted: 0,
      succeeded: 0,
      retried: 0,
      failedToFinish: 0,
      model,
      executionMode: "vercel_ai_gateway_oidc",
      authority: {
        productionWrite: false,
        merge: false,
        deployment: false,
        publicRelease: false,
        rawRecoveryPayloadExport: false,
      },
      checkedAt,
    };
  }

  const results = await Promise.all(claims.map((claim) => executeClaim(claim, model)));
  const succeeded = results.filter((result) => result === "succeeded").length;
  const retried = results.filter((result) => result === "retried").length;
  const failedToFinish = results.filter((result) => result === "failed_to_finish").length;

  return {
    marker: "pantavion_recovery_agent_bundle_tick_v1",
    status: retried > 0 || failedToFinish > 0 ? "degraded" : "ran",
    attempted: claims.length,
    succeeded,
    retried,
    failedToFinish,
    model,
    executionMode: "vercel_ai_gateway_oidc",
    authority: {
      productionWrite: false,
      merge: false,
      deployment: false,
      publicRelease: false,
      rawRecoveryPayloadExport: false,
    },
    checkedAt,
  };
}
