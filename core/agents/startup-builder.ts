import crypto from "node:crypto";
import { callPantavionAI } from "../ai/provider-router";
import { appendKernelAudit } from "../kernel/kernel-audit";
import { classifyExecution } from "../runtime/execution-safety";

export async function runStartupBuilder(input: {
  idea: string;
  actor?: string;
}) {
  const actor = input.actor ?? "startup-builder";
  const idea = String(input.idea ?? "").trim();

  if (idea.length < 8) {
    return {
      ok: false,
      status: "invalid_idea",
      message: "Startup idea is too short.",
    };
  }

  const verdict = classifyExecution({
    actor,
    action: "startup-builder generate architecture and execution plan",
  });

  const system = [
    "You are Pantavion Sovereign Startup Builder.",
    "You must produce implementation-ready startup architecture.",
    "No fake features. Every proposed capability must include route, logic, state/data flow, provider/source when needed, disabled/beta/internal status, tests/checks, and approval zone.",
    "Do not propose production deployment for sensitive actions without founder approval.",
  ].join("\n");

  const prompt = [
    "Build a startup execution blueprint for this idea:",
    idea,
    "",
    "Return:",
    "1. Product thesis",
    "2. Real MVP capabilities",
    "3. Routes/API needed",
    "4. State/data model",
    "5. Providers/data sources",
    "6. Runtime safety zones",
    "7. Build/typecheck/audit gates",
    "8. First patch plan",
  ].join("\n");

  const ai = await callPantavionAI({ system, prompt });

  await appendKernelAudit({
    id: crypto.randomUUID(),
    type: "agent.startup_builder.requested",
    actor,
    createdAt: new Date().toISOString(),
    payload: {
      ideaHash: crypto.createHash("sha256").update(idea).digest("hex"),
      ideaLength: idea.length,
      safetyVerdict: verdict,
      aiProviderStatus: ai.ok ? "ok" : ai.status,
      provider: ai.provider,
    },
  });

  if (!ai.ok) {
    return {
      ok: false,
      status: "ai_provider_not_ready",
      disabled: true,
      message: ai.message,
      safetyVerdict: verdict,
    };
  }

  return {
    ok: true,
    status: "generated_with_real_provider",
    provider: ai.provider,
    model: ai.model,
    safetyVerdict: verdict,
    result: ai.text,
  };
}
