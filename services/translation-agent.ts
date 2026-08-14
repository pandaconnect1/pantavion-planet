import fetch from "node-fetch";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseDurableExecutionStore } from "@/core/runtime/supabase-durable-execution-store";

// Simple background worker scaffold for translation agent.
// Run this with `node ./services/translation-agent.js` (or via PM2/systemd) to operate 24/7.

const POLL_INTERVAL_MS = Number(process.env.TRANSLATION_AGENT_POLL_MS) || 2500;
const INTERNAL_BASE = process.env.PANTAVION_INTERNAL_BASE || "http://localhost:3000";

export async function startTranslationAgent() {
  console.log("[translation-agent] starting");
  const durable = createSupabaseDurableExecutionStore();

  async function poll() {
    try {
      const pending = await durable.list(50);
      for (const exec of pending) {
        if (exec.status !== "pending") continue;
        // simple task routing by taskName
        if (exec.taskName === "translation:process_message") {
          await handleProcessMessage(exec);
        } else if (exec.taskName && exec.taskName.startsWith("control:")) {
          await handleControlTask(exec);
        }
      }
    } catch (err) {
      console.error("[translation-agent] poll error", err);
    } finally {
      setTimeout(poll, POLL_INTERVAL_MS);
    }
  }

  async function handleProcessMessage(exec) {
    console.log("[translation-agent] processing message", exec.executionId);
    // executor should call the translation route and post result back to DB.
    // expect exec.input to contain { messageId, conversationId, text, sourceLanguage, targetLanguages }
    try {
      const payload = exec.input || {};
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

      const body = await res.json().catch(() => null);
      console.log("[translation-agent] translate result", exec.executionId, body);

      // TODO: post translated text back to messages table using createAdminClient
      const admin = createAdminClient();
      await admin.from("messages").insert({
        conversation_id: payload.conversationId,
        sender_id: payload.systemSenderId || null,
        body: body?.translatedText || (body?.translatedText === undefined ? JSON.stringify(body) : ""),
        original_language: payload.sourceLanguage || null,
        message_type: "translation",
        metadata: { provenance: { providerResult: body } },
      });

      await durable.put({
        executionId: exec.executionId,
        idempotencyKey: exec.idempotencyKey,
        taskName: exec.taskName,
        status: "done",
        attempt: exec.attempt + 1,
        maxAttempts: exec.maxAttempts || 3,
        input: exec.input,
        output: body ?? null,
        lastError: null,
        createdAt: exec.createdAt,
        updatedAt: new Date().toISOString(),
        checkpoints: [],
      });
    } catch (err) {
      console.error("[translation-agent] process_message error", err);
      await durable.put({
        executionId: exec.executionId,
        idempotencyKey: exec.idempotencyKey,
        taskName: exec.taskName,
        status: "failed",
        attempt: exec.attempt + 1,
        maxAttempts: exec.maxAttempts || 3,
        input: exec.input,
        output: null,
        lastError: String(err?.message || err),
        createdAt: exec.createdAt,
        updatedAt: new Date().toISOString(),
        checkpoints: [],
      });
    }
  }

  async function handleControlTask(exec) {
    console.log("[translation-agent] handling control task", exec.executionId);
    // placeholder for control instructions from GPT
    // mark done for now
    await durable.put({
      executionId: exec.executionId,
      idempotencyKey: exec.idempotencyKey,
      taskName: exec.taskName,
      status: "done",
      attempt: exec.attempt + 1,
      maxAttempts: exec.maxAttempts || 3,
      input: exec.input,
      output: { ok: true, note: "no-op control handler placeholder" },
      lastError: null,
      createdAt: exec.createdAt,
      updatedAt: new Date().toISOString(),
      checkpoints: [],
    });
  }

  // start polling loop
  poll();
}

if (require.main === module) {
  startTranslationAgent().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
