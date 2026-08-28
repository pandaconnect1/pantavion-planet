import { randomUUID } from "node:crypto";
import { createSupabaseDurableExecutionStore } from "@/core/runtime/supabase-durable-execution-store";
import type { PantavionDurableExecutionRecord } from "@/core/runtime/durable-execution";
import {
  PantavionStaleExecutionFenceError,
  type PantavionExecutionFence,
} from "@/core/runtime/durable-execution-fencing";

const POLL_INTERVAL_MS = Number(process.env.TRANSLATION_AGENT_POLL_MS) || 2500;
const INTERNAL_BASE = process.env.PANTAVION_INTERNAL_BASE || "http://localhost:3000";
const MIN_LEASE_MS = 5_000;
const MAX_LEASE_MS = 300_000;
const DEFAULT_LEASE_MS = 120_000;

type TranslationTaskInput = {
  messageId?: string;
  conversationId?: string;
  text?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  sessionId?: string | null;
  systemSenderId?: string;
};

type TranslationResponse = {
  ok?: boolean;
  status?: string;
  translatedText?: string;
  provider?: string;
  model?: string;
  [key: string]: unknown;
};

type ClaimedTranslationExecution = {
  record: PantavionDurableExecutionRecord;
  fence: PantavionExecutionFence;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function configuredLeaseMs() {
  const requested = Number(process.env.TRANSLATION_AGENT_LEASE_MS);
  if (!Number.isFinite(requested) || requested <= 0) return DEFAULT_LEASE_MS;
  return Math.max(MIN_LEASE_MS, Math.min(MAX_LEASE_MS, Math.floor(requested)));
}

function requirePayload(input: unknown): TranslationTaskInput {
  const payload = (input ?? {}) as TranslationTaskInput;
  if (!payload.conversationId) throw new Error("translation_conversation_id_required");
  if (!payload.systemSenderId) throw new Error("translation_system_sender_id_required");
  if (!payload.text?.trim()) throw new Error("translation_text_required");
  return payload;
}

export async function startTranslationAgent() {
  console.log("[translation-agent] starting");
  const durable = createSupabaseDurableExecutionStore();
  const workerId = `translation-agent:${process.pid}:${randomUUID()}`;
  const leaseMs = configuredLeaseMs();

  async function claimExecution(exec: PantavionDurableExecutionRecord): Promise<ClaimedTranslationExecution | null> {
    const claimed = await durable.claimFenced(
      exec.executionId,
      workerId,
      leaseMs,
      ["queued", "planned"],
    );
    if (!claimed) return null;

    const running = await durable.checkpointFenced(claimed.fence, "attempt_started", {
      attempt: claimed.record.attempt,
      maxAttempts: Math.max(1, claimed.record.maxAttempts ?? 3),
      claim: "pantavion_claim_durable_execution_fenced",
      worker: "pantavion_owned_translation_agent",
    });

    return { record: running, fence: claimed.fence };
  }

  async function finishSuccess(fence: PantavionExecutionFence, output: unknown) {
    await durable.finishFencedSuccess(fence, output);
  }

  async function finishFailure(fence: PantavionExecutionFence, error: unknown) {
    await durable.finishFencedFailure(fence, errorMessage(error));
  }

  async function persistTranslation(
    payload: TranslationTaskInput,
    executionId: string,
    fence: PantavionExecutionFence,
    body: TranslationResponse,
  ) {
    const translatedText = typeof body.translatedText === "string" ? body.translatedText.trim() : "";
    if (!translatedText) throw new Error("translation_provider_returned_empty_text");

    return durable.persistTranslationFenced(fence, {
      conversationId: payload.conversationId!,
      senderId: payload.systemSenderId!,
      clientMessageId: `translation:${executionId}`,
      body: translatedText,
      originalLanguage: payload.sourceLanguage || null,
      metadata: {
        source_message_id: payload.messageId || null,
        target_language: payload.targetLanguage || "en",
        provenance: {
          provider: body.provider || null,
          model: body.model || null,
          provider_status: body.status || null,
        },
      },
    });
  }

  async function handleProcessMessage(exec: PantavionDurableExecutionRecord, fence: PantavionExecutionFence) {
    const payload = requirePayload(exec.input);

    try {
      // Renew immediately before the potentially slow provider call.
      await durable.heartbeatFenced(fence, leaseMs);

      const res = await fetch(`${INTERNAL_BASE}/api/pantavion/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: payload.text,
          sourceLanguage: payload.sourceLanguage || "auto",
          targetLanguage: payload.targetLanguage || "en",
          sessionId: payload.sessionId || null,
        }),
      });

      const body = (await res.json().catch(() => null)) as TranslationResponse | null;
      if (!res.ok) {
        throw new Error(`translation_http_${res.status}:${body?.status || "unknown"}`);
      }
      if (!body || body.ok === false) {
        throw new Error(`translation_provider_failed:${body?.status || "unknown"}`);
      }

      // The RPC below re-checks owner + fencing token + lease expiry and performs the
      // message dedupe/insert in the same PostgreSQL transaction. A heartbeat alone is
      // not accepted as proof for this user-visible side effect.
      await durable.heartbeatFenced(fence, leaseMs);
      const message = await persistTranslation(payload, exec.executionId, fence, body);
      await finishSuccess(fence, { providerResult: body, message });
    } catch (error) {
      if (error instanceof PantavionStaleExecutionFenceError) {
        console.warn("[translation-agent] stale lease; abandoning execution", exec.executionId);
        return;
      }

      console.error("[translation-agent] process_message error", exec.executionId, error);
      try {
        await finishFailure(fence, error);
      } catch (finishError) {
        if (finishError instanceof PantavionStaleExecutionFenceError) {
          console.warn("[translation-agent] lease lost before failure finalization", exec.executionId);
          return;
        }
        throw finishError;
      }
    }
  }

  async function poll() {
    try {
      const executions = await durable.list(50);
      for (const exec of executions) {
        if (!["queued", "planned"].includes(exec.status)) continue;
        if (exec.taskName !== "translation:process_message") {
          if (exec.taskName?.startsWith("control:")) {
            console.warn("[translation-agent] refusing unsupported control task", exec.executionId, exec.taskName);
          }
          continue;
        }

        const claimed = await claimExecution(exec);
        if (claimed) await handleProcessMessage(claimed.record, claimed.fence);
      }
    } catch (error) {
      console.error("[translation-agent] poll error", error);
    } finally {
      setTimeout(poll, POLL_INTERVAL_MS);
    }
  }

  void poll();
}

if (typeof require !== "undefined" && require.main === module) {
  startTranslationAgent().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
