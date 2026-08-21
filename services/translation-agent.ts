import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseDurableExecutionStore } from "@/core/runtime/supabase-durable-execution-store";
import type { PantavionDurableExecutionRecord } from "@/core/runtime/durable-execution";

const POLL_INTERVAL_MS = Number(process.env.TRANSLATION_AGENT_POLL_MS) || 2500;
const INTERNAL_BASE = process.env.PANTAVION_INTERNAL_BASE || "http://localhost:3000";

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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function checkpoint(
  record: PantavionDurableExecutionRecord,
  label: string,
  state: Record<string, unknown> = {},
): PantavionDurableExecutionRecord {
  const at = new Date().toISOString();
  return {
    ...record,
    updatedAt: at,
    checkpoints: [
      ...record.checkpoints,
      {
        id: `${record.executionId}:${record.checkpoints.length + 1}`,
        at,
        label,
        state,
      },
    ],
  };
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

  async function putRunning(exec: PantavionDurableExecutionRecord) {
    const maxAttempts = Math.max(1, exec.maxAttempts ?? 3);
    if (exec.attempt >= maxAttempts) {
      const exhausted = checkpoint(
        { ...exec, status: "failed", lastError: "execution_attempts_exhausted" },
        "failed",
        { reason: "execution_attempts_exhausted", maxAttempts },
      );
      await durable.put(exhausted);
      return null;
    }

    const running = checkpoint(
      {
        ...exec,
        status: "running",
        attempt: exec.attempt + 1,
        lastError: undefined,
      },
      "attempt_started",
      { attempt: exec.attempt + 1, maxAttempts },
    );
    await durable.put(running);
    return running;
  }

  async function finishSuccess(exec: PantavionDurableExecutionRecord, output: unknown) {
    const latest = (await durable.get(exec.executionId)) ?? exec;
    const succeeded = checkpoint(
      {
        ...latest,
        status: "succeeded",
        output,
        lastError: undefined,
      },
      "succeeded",
    );
    await durable.put(succeeded);
  }

  async function finishFailure(exec: PantavionDurableExecutionRecord, error: unknown) {
    const latest = (await durable.get(exec.executionId)) ?? exec;
    const maxAttempts = Math.max(1, latest.maxAttempts ?? 3);
    const exhausted = latest.attempt >= maxAttempts;
    const message = errorMessage(error);
    const failed = checkpoint(
      {
        ...latest,
        status: exhausted ? "failed" : "queued",
        output: undefined,
        lastError: message,
      },
      exhausted ? "failed" : "retry_scheduled",
      { error: message, attempt: latest.attempt, maxAttempts },
    );
    await durable.put(failed);
  }

  async function findExistingTranslation(payload: TranslationTaskInput, executionId: string) {
    const admin = createAdminClient();
    const result = await admin
      .from("messages")
      .select("id,body,metadata")
      .eq("sender_id", payload.systemSenderId!)
      .eq("client_message_id", `translation:${executionId}`)
      .maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  }

  async function persistTranslation(
    payload: TranslationTaskInput,
    executionId: string,
    body: TranslationResponse,
  ) {
    const translatedText = typeof body.translatedText === "string" ? body.translatedText.trim() : "";
    if (!translatedText) throw new Error("translation_provider_returned_empty_text");

    const existing = await findExistingTranslation(payload, executionId);
    if (existing) return existing;

    const admin = createAdminClient();
    const result = await admin.from("messages").insert({
      conversation_id: payload.conversationId,
      sender_id: payload.systemSenderId,
      client_message_id: `translation:${executionId}`,
      body: translatedText,
      original_language: payload.sourceLanguage || null,
      message_type: "system",
      metadata: {
        kind: "translation",
        source_message_id: payload.messageId || null,
        target_language: payload.targetLanguage || "en",
        provenance: {
          provider: body.provider || null,
          model: body.model || null,
          provider_status: body.status || null,
        },
      },
    });

    if (result.error && result.error.code !== "23505") throw result.error;
    if (result.error?.code === "23505") {
      const raced = await findExistingTranslation(payload, executionId);
      if (raced) return raced;
      throw result.error;
    }

    return { clientMessageId: `translation:${executionId}`, translatedText };
  }

  async function handleProcessMessage(exec: PantavionDurableExecutionRecord) {
    const payload = requirePayload(exec.input);

    try {
      const existing = await findExistingTranslation(payload, exec.executionId);
      if (existing) {
        await finishSuccess(exec, { ok: true, deduplicated: true, message: existing });
        return;
      }

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

      const message = await persistTranslation(payload, exec.executionId, body);
      await finishSuccess(exec, { providerResult: body, message });
    } catch (error) {
      console.error("[translation-agent] process_message error", exec.executionId, error);
      await finishFailure(exec, error);
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

        const running = await putRunning(exec);
        if (running) await handleProcessMessage(running);
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
