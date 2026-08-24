import { generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { executePantavionIntent } from "@/core/intelligence/pantaai-engine";

export const PERSONAL_AI_TRUTH_STATES = [
  "KNOWN",
  "INFERRED",
  "UNVERIFIED",
  "PARTIAL",
  "BLOCKED",
  "VERIFIED",
  "VERIFIED_LIVE",
] as const;

export type PersonalAITruthState = (typeof PERSONAL_AI_TRUTH_STATES)[number];
export type PersonalAIInputMode = "text" | "voice" | "image" | "video" | "file" | "mixed";
type JsonObject = Record<string, unknown>;

type PersonalAIExecuteInput = {
  input: string;
  threadId?: string | null;
  parentThreadId?: string | null;
  inputMode?: PersonalAIInputMode;
  originalLanguage?: string | null;
  attachments?: unknown[];
  metadata?: JsonObject;
};

type PersonalAIProfile = {
  user_id: string;
  personal_ai_id: string;
  preferred_locale: string | null;
  timezone: string;
  assistance_level: "minimal" | "balanced" | "proactive" | "guided";
  memory_enabled: boolean;
  cross_thread_enabled: boolean;
  voice_enabled: boolean;
};

type PersonalAIThread = {
  id: string;
  user_id: string;
  parent_thread_id: string | null;
  continuity_summary: string;
  title: string | null;
};

type CurrentTurn = { role: string; content: string; created_at: string };
type CrossTurn = CurrentTurn & { thread_id: string };
type MemoryRow = { memory_type: string; content: string; truth_state: string; confidence: number; updated_at: string };
type ItemRow = { kind: string; title: string | null; body: string; due_at: string | null; status: string };
type RelationshipRow = { display_name: string; relationship_type: string; aliases: string[]; notes: string };

type ContextBundle = {
  currentTurns: CurrentTurn[];
  crossThreadTurns: CrossTurn[];
  memories: MemoryRow[];
  items: ItemRow[];
  relationships: RelationshipRow[];
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function compactLines(lines: string[], maxChars: number) {
  const output: string[] = [];
  let used = 0;
  for (const line of lines) {
    if (!line) continue;
    const remaining = maxChars - used;
    if (remaining <= 0) break;
    const next = line.slice(0, remaining);
    output.push(next);
    used += next.length;
  }
  return output.join("\n");
}

function tokenize(value: string) {
  return new Set(
    value.toLocaleLowerCase().normalize("NFKC").split(/[^\p{L}\p{N}]+/u).filter((part) => part.length > 1),
  );
}

function lexicalScore(query: string, candidate: string) {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return 0;
  const candidateTokens = tokenize(candidate);
  let matches = 0;
  for (const token of queryTokens) if (candidateTokens.has(token)) matches += 1;
  return matches / queryTokens.size;
}

function rankByRelevance<T>(query: string, rows: T[], text: (row: T) => string, limit: number) {
  return rows
    .map((row, index) => ({ row, index, score: lexicalScore(query, text(row)) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ row }) => row);
}

async function ensurePersonalAIProfile(supabase: SupabaseClient, userId: string): Promise<PersonalAIProfile> {
  const existing = await supabase
    .from("personal_ai_profiles")
    .select("user_id,personal_ai_id,preferred_locale,timezone,assistance_level,memory_enabled,cross_thread_enabled,voice_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing.error) throw new Error(`personal_ai_profile_read_failed:${existing.error.message}`);
  if (existing.data) return existing.data as PersonalAIProfile;

  const source = await supabase.from("profiles").select("language,country,country_code").eq("id", userId).maybeSingle();
  if (source.error) throw new Error(`personal_ai_source_profile_read_failed:${source.error.message}`);

  const preferredLocale = cleanText(source.data?.language, 32) || null;
  const created = await supabase
    .from("personal_ai_profiles")
    .insert({
      user_id: userId,
      preferred_locale: preferredLocale,
      language_profile: {
        preferredLanguage: preferredLocale,
        country: cleanText(source.data?.country, 120) || null,
        countryCode: cleanText(source.data?.country_code, 8) || null,
      },
    })
    .select("user_id,personal_ai_id,preferred_locale,timezone,assistance_level,memory_enabled,cross_thread_enabled,voice_enabled")
    .single();

  if (created.error) {
    const raced = await supabase
      .from("personal_ai_profiles")
      .select("user_id,personal_ai_id,preferred_locale,timezone,assistance_level,memory_enabled,cross_thread_enabled,voice_enabled")
      .eq("user_id", userId)
      .single();
    if (raced.error) throw new Error(`personal_ai_profile_create_failed:${created.error.message}`);
    return raced.data as PersonalAIProfile;
  }
  return created.data as PersonalAIProfile;
}

async function resolveThread(supabase: SupabaseClient, userId: string, input: PersonalAIExecuteInput): Promise<PersonalAIThread> {
  if (input.threadId) {
    const existing = await supabase
      .from("personal_ai_threads")
      .select("id,user_id,parent_thread_id,continuity_summary,title")
      .eq("id", input.threadId)
      .eq("user_id", userId)
      .single();
    if (existing.error || !existing.data) throw new Error("personal_ai_thread_not_found");
    return existing.data as PersonalAIThread;
  }

  let parentSummary = "";
  if (input.parentThreadId) {
    const parent = await supabase
      .from("personal_ai_threads")
      .select("id,continuity_summary")
      .eq("id", input.parentThreadId)
      .eq("user_id", userId)
      .single();
    if (parent.error || !parent.data) throw new Error("personal_ai_parent_thread_not_found");
    parentSummary = cleanText(parent.data.continuity_summary, 6000);
  }

  const created = await supabase
    .from("personal_ai_threads")
    .insert({
      user_id: userId,
      parent_thread_id: input.parentThreadId || null,
      title: cleanText(input.input, 72) || "Personal AI",
      continuity_summary: parentSummary,
      state: input.parentThreadId ? { handedOffFrom: input.parentThreadId } : {},
    })
    .select("id,user_id,parent_thread_id,continuity_summary,title")
    .single();
  if (created.error || !created.data) throw new Error(`personal_ai_thread_create_failed:${created.error?.message || "unknown"}`);
  return created.data as PersonalAIThread;
}

async function collectContext(
  supabase: SupabaseClient,
  userId: string,
  threadId: string,
  query: string,
  profile: PersonalAIProfile,
): Promise<ContextBundle> {
  const current = await supabase
    .from("personal_ai_turns")
    .select("role,content,created_at")
    .eq("user_id", userId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(24);
  if (current.error) throw new Error(`personal_ai_context_current_failed:${current.error.message}`);

  let crossRows: CrossTurn[] = [];
  if (profile.cross_thread_enabled) {
    const cross = await supabase
      .from("personal_ai_turns")
      .select("role,content,created_at,thread_id")
      .eq("user_id", userId)
      .neq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (cross.error) throw new Error(`personal_ai_context_cross_failed:${cross.error.message}`);
    crossRows = (cross.data || []) as CrossTurn[];
  }

  let memoryRows: MemoryRow[] = [];
  if (profile.memory_enabled) {
    const memories = await supabase
      .from("personal_ai_memories")
      .select("memory_type,content,truth_state,confidence,updated_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (memories.error) throw new Error(`personal_ai_context_memory_failed:${memories.error.message}`);
    memoryRows = (memories.data || []) as MemoryRow[];
  }

  const items = await supabase
    .from("personal_ai_items")
    .select("kind,title,body,due_at,status")
    .eq("user_id", userId)
    .eq("status", "open")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(40);
  if (items.error) throw new Error(`personal_ai_context_items_failed:${items.error.message}`);

  const relationships = await supabase
    .from("personal_ai_relationship_contexts")
    .select("display_name,relationship_type,aliases,notes")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (relationships.error) throw new Error(`personal_ai_context_relationships_failed:${relationships.error.message}`);

  return {
    currentTurns: ((current.data || []) as CurrentTurn[]).reverse(),
    crossThreadTurns: rankByRelevance(query, crossRows, (row) => row.content, 12),
    memories: rankByRelevance(query, memoryRows, (row) => row.content, 16),
    items: (items.data || []) as ItemRow[],
    relationships: rankByRelevance(
      query,
      (relationships.data || []) as RelationshipRow[],
      (row) => `${row.display_name} ${row.relationship_type} ${(row.aliases || []).join(" ")} ${row.notes}`,
      12,
    ),
  };
}

function buildContextText(context: ContextBundle, continuitySummary: string) {
  return compactLines([
    continuitySummary ? `CONTINUITY CHECKPOINT:\n${continuitySummary}` : "",
    context.currentTurns.length ? `CURRENT THREAD:\n${context.currentTurns.map((row) => `${row.role}: ${row.content}`).join("\n")}` : "",
    context.crossThreadTurns.length ? `RELEVANT OTHER THREADS:\n${context.crossThreadTurns.map((row) => `[${row.thread_id}] ${row.role}: ${row.content}`).join("\n")}` : "",
    context.memories.length ? `USER MEMORIES:\n${context.memories.map((row) => `[${row.memory_type}/${row.truth_state}/${row.confidence}] ${row.content}`).join("\n")}` : "",
    context.items.length ? `OPEN LIFE ITEMS:\n${context.items.map((row) => `[${row.kind}${row.due_at ? ` due ${row.due_at}` : ""}] ${row.title || ""} ${row.body}`.trim()).join("\n")}` : "",
    context.relationships.length ? `RELATIONSHIP CONTEXT:\n${context.relationships.map((row) => `[${row.relationship_type}] ${row.display_name}; aliases=${(row.aliases || []).join(",")}; notes=${row.notes}`).join("\n")}` : "",
  ], 18000);
}

function buildSystemPrompt(profile: PersonalAIProfile, metadata: JsonObject) {
  const driving = metadata.driving === true || metadata.handsFree === true;
  return compactLines([
    "You are the authenticated Pantavion Personal AI for exactly one user. Never mix this user's data with another user's context.",
    "Continue naturally across threads using only the authorized context supplied. If context is missing, stale, or conflicting, state that instead of inventing facts.",
    "Understand natural writing including dialect, slang, transliteration, mixed languages, abbreviations, incomplete phrasing and likely typing mistakes. Preserve intended meaning before translating.",
    `Preferred locale=${profile.preferred_locale || "unknown"}; timezone=${profile.timezone}; assistance=${profile.assistance_level}.`,
    "Adapt complexity and explanation style to the user while preserving user agency, privacy and consent.",
    "For health, legal, financial and safety-sensitive matters, communicate uncertainty and limits. Never present astrology or other entertainment/non-scientific systems as established science.",
    "Treat retrieved memories according to their provenance/truth labels. Prefer explicit newer verified information over older inference when conflicts exist.",
    driving ? "HANDS-FREE DRIVING MODE: answer briefly and voice-first. Never ask the user to read, type, tap, inspect a screen or do anything distracting while driving." : "",
    "Answer in the user's language unless the user asks for another language.",
  ], 6000);
}

function nextContinuitySummary(previous: string, userInput: string, assistantReply: string) {
  return compactLines([
    cleanText(previous, 3500),
    `Latest user: ${cleanText(userInput, 1200)}`,
    `Latest assistant: ${cleanText(assistantReply, 1800)}`,
  ], 6000);
}

export async function executePersonalAI(supabase: SupabaseClient, userId: string, body: PersonalAIExecuteInput) {
  const input = cleanText(body.input, 30000);
  if (!input) throw new Error("personal_ai_input_required");

  const inputMode = body.inputMode || "text";
  const allowedModes: PersonalAIInputMode[] = ["text", "voice", "image", "video", "file", "mixed"];
  if (!allowedModes.includes(inputMode)) throw new Error("personal_ai_input_mode_invalid");

  const profile = await ensurePersonalAIProfile(supabase, userId);
  if (inputMode === "voice" && !profile.voice_enabled) throw new Error("personal_ai_voice_disabled");
  const thread = await resolveThread(supabase, userId, body);

  const userTurn = await supabase.from("personal_ai_turns").insert({
    user_id: userId,
    thread_id: thread.id,
    role: "user",
    content: input,
    original_language: cleanText(body.originalLanguage, 32) || null,
    input_mode: inputMode,
    attachments: Array.isArray(body.attachments) ? body.attachments.slice(0, 24) : [],
    metadata: body.metadata || {},
    truth_state: "KNOWN",
  });
  if (userTurn.error) throw new Error(`personal_ai_user_turn_write_failed:${userTurn.error.message}`);

  const context = await collectContext(supabase, userId, thread.id, input, profile);
  const modelName = process.env.PANTAVION_AI_MODEL?.trim() || "openai/gpt-5.6-sol";
  const providerConfigured = Boolean(process.env.AI_GATEWAY_API_KEY?.trim());
  let reply = "";
  let truthState: PersonalAITruthState = "UNVERIFIED";
  let executionStatus: "completed" | "blocked" = "completed";
  let provider = `vercel-ai-gateway:${modelName}`;

  if (providerConfigured) {
    try {
      const generated = await generateText({
        model: modelName,
        system: buildSystemPrompt(profile, body.metadata || {}),
        prompt: `${buildContextText(context, thread.continuity_summary)}\n\nCURRENT USER INPUT:\n${input}`,
        providerOptions: {
          gateway: {
            user: userId,
            tags: ["pantavion-personal-ai"],
            disallowPromptTraining: true,
          },
        },
      });
      reply = cleanText(generated.text, 30000) || "Δεν δημιουργήθηκε απάντηση από το μοντέλο.";
      truthState = "UNVERIFIED";
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "unknown_provider_error";
      reply = "Το μήνυμα και η συνέχεια αποθηκεύτηκαν, αλλά ο AI provider απέτυχε. Δεν παρουσιάζω ψεύτικη επιτυχία.";
      truthState = "BLOCKED";
      executionStatus = "blocked";
      await supabase.from("personal_ai_action_audit").insert({
        user_id: userId,
        thread_id: thread.id,
        action_type: "personal_ai_provider_error",
        status: "failed",
        truth_state: "BLOCKED",
        provider,
        input_summary: input.slice(0, 1000),
        output_summary: detail.slice(0, 2000),
      });
    }
  } else {
    const fallback = executePantavionIntent(input);
    provider = "not_configured";
    reply = `Το Personal AI context και η μνήμη καταγράφηκαν. Η generative απάντηση είναι BLOCKED επειδή δεν υπάρχει AI_GATEWAY_API_KEY. Deterministic routing: ${fallback.intentClass} → ${fallback.capabilityFamily}.`;
    truthState = "BLOCKED";
    executionStatus = "blocked";
  }

  const assistantTurn = await supabase.from("personal_ai_turns").insert({
    user_id: userId,
    thread_id: thread.id,
    role: "assistant",
    content: reply,
    input_mode: "text",
    metadata: { provider, model: providerConfigured ? modelName : null },
    truth_state: truthState,
  });
  if (assistantTurn.error) throw new Error(`personal_ai_assistant_turn_write_failed:${assistantTurn.error.message}`);

  const threadUpdate = await supabase
    .from("personal_ai_threads")
    .update({
      continuity_summary: nextContinuitySummary(thread.continuity_summary, input, reply),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", thread.id)
    .eq("user_id", userId);
  if (threadUpdate.error) throw new Error(`personal_ai_thread_update_failed:${threadUpdate.error.message}`);

  const audit = await supabase.from("personal_ai_action_audit").insert({
    user_id: userId,
    thread_id: thread.id,
    action_type: "personal_ai_response",
    status: executionStatus,
    truth_state: truthState,
    provider,
    input_summary: input.slice(0, 1000),
    output_summary: reply.slice(0, 2000),
    metadata: {
      inputMode,
      currentThreadTurns: context.currentTurns.length,
      crossThreadTurns: context.crossThreadTurns.length,
      memories: context.memories.length,
      openItems: context.items.length,
      relationships: context.relationships.length,
    },
  });
  if (audit.error) throw new Error(`personal_ai_audit_write_failed:${audit.error.message}`);

  return {
    ok: true,
    personalAiId: profile.personal_ai_id,
    threadId: thread.id,
    parentThreadId: thread.parent_thread_id,
    reply,
    provider,
    truthState,
    executionStatus,
    continuity: {
      crossThreadEnabled: profile.cross_thread_enabled,
      memoryEnabled: profile.memory_enabled,
      checkpointUpdated: true,
    },
    contextStats: {
      currentThreadTurns: context.currentTurns.length,
      crossThreadTurns: context.crossThreadTurns.length,
      memories: context.memories.length,
      openItems: context.items.length,
      relationships: context.relationships.length,
    },
  };
}

export async function getPersonalAIState(supabase: SupabaseClient, userId: string) {
  const profile = await ensurePersonalAIProfile(supabase, userId);
  const threads = await supabase.from("personal_ai_threads").select("id,parent_thread_id,title,continuity_summary,status,last_activity_at").eq("user_id", userId).order("last_activity_at", { ascending: false }).limit(30);
  if (threads.error) throw new Error(`personal_ai_state_threads_failed:${threads.error.message}`);
  const memories = await supabase.from("personal_ai_memories").select("id,thread_id,memory_type,scope,content,source_type,source_ref,confidence,truth_state,updated_at").eq("user_id", userId).is("deleted_at", null).order("updated_at", { ascending: false }).limit(50);
  if (memories.error) throw new Error(`personal_ai_state_memories_failed:${memories.error.message}`);
  const items = await supabase.from("personal_ai_items").select("id,thread_id,kind,title,body,subject_label,due_at,recurrence,status,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50);
  if (items.error) throw new Error(`personal_ai_state_items_failed:${items.error.message}`);
  const relationships = await supabase.from("personal_ai_relationship_contexts").select("id,subject_key,display_name,relationship_type,aliases,notes,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50);
  if (relationships.error) throw new Error(`personal_ai_state_relationships_failed:${relationships.error.message}`);

  return {
    ok: true,
    profile,
    threads: threads.data || [],
    memories: memories.data || [],
    items: items.data || [],
    relationships: relationships.data || [],
  };
}
