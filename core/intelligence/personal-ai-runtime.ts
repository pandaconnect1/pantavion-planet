import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
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
  communication_preferences: JsonObject;
  language_profile: JsonObject;
  privacy_settings: JsonObject;
};

type PersonalAIThread = {
  id: string;
  user_id: string;
  parent_thread_id: string | null;
  continuity_summary: string;
  title: string | null;
};

type ContextBundle = {
  currentTurns: Array<{ role: string; content: string; created_at: string }>;
  crossThreadTurns: Array<{ role: string; content: string; created_at: string; thread_id: string }>;
  memories: Array<{ memory_type: string; content: string; truth_state: string; confidence: number; updated_at: string }>;
  items: Array<{ kind: string; title: string | null; body: string; due_at: string | null; status: string }>;
  relationships: Array<{ display_name: string; relationship_type: string; aliases: string[]; notes: string }>;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function compactLines(lines: string[], maxChars: number) {
  const output: string[] = [];
  let used = 0;
  for (const line of lines) {
    if (!line) continue;
    const next = line.slice(0, Math.max(0, maxChars - used));
    if (!next) break;
    output.push(next);
    used += next.length;
    if (used >= maxChars) break;
  }
  return output.join("\n");
}

function tokenize(value: string) {
  return new Set(
    value
      .toLocaleLowerCase()
      .normalize("NFKC")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((part) => part.length > 1)
  );
}

function lexicalScore(query: string, candidate: string) {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return 0;
  const candidateTokens = tokenize(candidate);
  let matches = 0;
  for (const token of queryTokens) {
    if (candidateTokens.has(token)) matches += 1;
  }
  return matches / queryTokens.size;
}

function rankByRelevance<T>(query: string, values: T[], getText: (value: T) => string, limit: number) {
  return values
    .map((value, index) => ({ value, index, score: lexicalScore(query, getText(value)) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.value);
}

async function ensurePersonalAIProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<PersonalAIProfile> {
  const { data: existing, error: readError } = await supabase
    .from("personal_ai_profiles")
    .select("user_id,personal_ai_id,preferred_locale,timezone,assistance_level,memory_enabled,cross_thread_enabled,voice_enabled,communication_preferences,language_profile,privacy_settings")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) throw new Error(`personal_ai_profile_read_failed:${readError.message}`);
  if (existing) return existing as PersonalAIProfile;

  const { data: sourceProfile } = await supabase
    .from("profiles")
    .select("language,country,country_code")
    .eq("id", userId)
    .maybeSingle();

  const preferredLocale = cleanText(sourceProfile?.language, 32) || null;
  const languageProfile: JsonObject = {
    preferredLanguage: preferredLocale,
    country: cleanText(sourceProfile?.country, 120) || null,
    countryCode: cleanText(sourceProfile?.country_code, 8) || null,
  };

  const { data: created, error: createError } = await supabase
    .from("personal_ai_profiles")
    .insert({
      user_id: userId,
      preferred_locale: preferredLocale,
      language_profile: languageProfile,
    })
    .select("user_id,personal_ai_id,preferred_locale,timezone,assistance_level,memory_enabled,cross_thread_enabled,voice_enabled,communication_preferences,language_profile,privacy_settings")
    .single();

  if (createError) {
    const { data: raced, error: racedError } = await supabase
      .from("personal_ai_profiles")
      .select("user_id,personal_ai_id,preferred_locale,timezone,assistance_level,memory_enabled,cross_thread_enabled,voice_enabled,communication_preferences,language_profile,privacy_settings")
      .eq("user_id", userId)
      .single();
    if (racedError) throw new Error(`personal_ai_profile_create_failed:${createError.message}`);
    return raced as PersonalAIProfile;
  }

  return created as PersonalAIProfile;
}

async function resolveThread(
  supabase: SupabaseClient,
  userId: string,
  input: PersonalAIExecuteInput,
): Promise<PersonalAIThread> {
  if (input.threadId) {
    const { data, error } = await supabase
      .from("personal_ai_threads")
      .select("id,user_id,parent_thread_id,continuity_summary,title")
      .eq("id", input.threadId)
      .eq("user_id", userId)
      .single();
    if (error || !data) throw new Error("personal_ai_thread_not_found");
    return data as PersonalAIThread;
  }

  let parentSummary = "";
  if (input.parentThreadId) {
    const { data: parent, error: parentError } = await supabase
      .from("personal_ai_threads")
      .select("id,continuity_summary")
      .eq("id", input.parentThreadId)
      .eq("user_id", userId)
      .single();
    if (parentError || !parent) throw new Error("personal_ai_parent_thread_not_found");
    parentSummary = cleanText(parent.continuity_summary, 6000);
  }

  const { data, error } = await supabase
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

  if (error || !data) throw new Error(`personal_ai_thread_create_failed:${error?.message || "unknown"}`);
  return data as PersonalAIThread;
}

async function collectContext(
  supabase: SupabaseClient,
  userId: string,
  threadId: string,
  query: string,
  profile: PersonalAIProfile,
): Promise<ContextBundle> {
  const currentTurnsPromise = supabase
    .from("personal_ai_turns")
    .select("role,content,created_at")
    .eq("user_id", userId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(24);

  const crossThreadPromise = profile.cross_thread_enabled
    ? supabase
        .from("personal_ai_turns")
        .select("role,content,created_at,thread_id")
        .eq("user_id", userId)
        .neq("thread_id", threadId)
        .order("created_at", { ascending: false })
        .limit(80)
    : Promise.resolve({ data: [], error: null });

  const memoriesPromise = profile.memory_enabled
    ? supabase
        .from("personal_ai_memories")
        .select("memory_type,content,truth_state,confidence,updated_at")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(80)
    : Promise.resolve({ data: [], error: null });

  const itemsPromise = supabase
    .from("personal_ai_items")
    .select("kind,title,body,due_at,status")
    .eq("user_id", userId)
    .eq("status", "open")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(30);

  const relationshipsPromise = supabase
    .from("personal_ai_relationship_contexts")
    .select("display_name,relationship_type,aliases,notes")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(40);

  const [currentTurns, crossTurns, memories, items, relationships] = await Promise.all([
    currentTurnsPromise,
    crossThreadPromise,
    memoriesPromise,
    itemsPromise,
    relationshipsPromise,
  ]);

  for (const result of [currentTurns, crossTurns, memories, items, relationships]) {
    if (result.error) throw new Error(`personal_ai_context_read_failed:${result.error.message}`);
  }

  const crossValues = (crossTurns.data || []) as ContextBundle["crossThreadTurns"];
  const memoryValues = (memories.data || []) as ContextBundle["memories"];
  const relationshipValues = (relationships.data || []) as ContextBundle["relationships"];

  return {
    currentTurns: ((currentTurns.data || []) as ContextBundle["currentTurns"]).reverse(),
    crossThreadTurns: rankByRelevance(query, crossValues, (value) => value.content, 10),
    memories: rankByRelevance(query, memoryValues, (value) => value.content, 12),
    items: (items.data || []) as ContextBundle["items"],
    relationships: rankByRelevance(
      query,
      relationshipValues,
      (value) => `${value.display_name} ${value.relationship_type} ${value.aliases.join(" ")} ${value.notes}`,
      10,
    ),
  };
}

function buildContextText(context: ContextBundle, continuitySummary: string) {
  const current = context.currentTurns.map((turn) => `${turn.role}: ${turn.content}`);
  const cross = context.crossThreadTurns.map((turn) => `[other-thread ${turn.thread_id}] ${turn.role}: ${turn.content}`);
  const memories = context.memories.map(
    (memory) => `[memory ${memory.memory_type}/${memory.truth_state}/${memory.confidence}] ${memory.content}`,
  );
  const items = context.items.map(
    (item) => `[${item.kind}${item.due_at ? ` due ${item.due_at}` : ""}] ${item.title || ""} ${item.body}`.trim(),
  );
  const relationships = context.relationships.map(
    (relationship) => `[relationship ${relationship.relationship_type}] ${relationship.display_name} aliases=${relationship.aliases.join(",")} notes=${relationship.notes}`,
  );

  return compactLines(
    [
      continuitySummary ? `CONTINUITY CHECKPOINT:\n${continuitySummary}` : "",
      current.length ? `CURRENT THREAD:\n${current.join("\n")}` : "",
      cross.length ? `RELEVANT OTHER THREADS:\n${cross.join("\n")}` : "",
      memories.length ? `USER-CONTROLLED MEMORIES:\n${memories.join("\n")}` : "",
      items.length ? `OPEN NOTES / DATES / TASKS:\n${items.join("\n")}` : "",
      relationships.length ? `RELATIONSHIP CONTEXT:\n${relationships.join("\n")}` : "",
    ],
    18000,
  );
}

function buildSystemPrompt(profile: PersonalAIProfile, metadata: JsonObject = {}) {
  const driving = metadata.driving === true || metadata.handsFree === true;
  return compactLines(
    [
      "You are the authenticated Pantavion Personal AI for exactly one user. Never mix this user's context with another user's data.",
      "Maintain continuity across threads using only the supplied authorized context. If context is missing or conflicting, say so instead of inventing facts.",
      "Understand the user's natural language as written, including dialect, slang, transliteration, mixed languages, abbreviations and likely typing mistakes. Preserve intended meaning before translating.",
      `Preferred locale: ${profile.preferred_locale || "unknown"}. Timezone: ${profile.timezone}. Assistance level: ${profile.assistance_level}.`,
      "Adapt complexity and explanation style to the user. Preserve user agency. Do not make high-impact decisions or irreversible actions without explicit authorization.",
      "For health, legal, financial or safety-sensitive topics, clearly communicate uncertainty and appropriate limits. Do not present entertainment or non-scientific systems such as astrology as established science.",
      "Treat memory snippets with their provenance/truth labels. Prefer newer, explicit, verified information over older inference when conflict exists.",
      driving
        ? "HANDS-FREE DRIVING MODE: keep the response brief and voice-friendly. Do not ask the user to read, type, tap, inspect a screen or perform distracting actions while driving."
        : "",
      "Answer in the user's language unless they request another language.",
    ],
    6000,
  );
}

function nextContinuitySummary(previous: string, userInput: string, assistantReply: string) {
  const previousPart = cleanText(previous, 3600);
  const exchange = `Latest user: ${cleanText(userInput, 1200)}\nLatest assistant: ${cleanText(assistantReply, 1800)}`;
  return compactLines([previousPart, exchange], 6000);
}

export async function executePersonalAI(
  supabase: SupabaseClient,
  userId: string,
  body: PersonalAIExecuteInput,
) {
  const input = cleanText(body.input, 30000);
  if (!input) throw new Error("personal_ai_input_required");

  const inputMode = body.inputMode || "text";
  const allowedInputModes: PersonalAIInputMode[] = ["text", "voice", "image", "video", "file", "mixed"];
  if (!allowedInputModes.includes(inputMode)) throw new Error("personal_ai_input_mode_invalid");

  const profile = await ensurePersonalAIProfile(supabase, userId);
  if (inputMode === "voice" && !profile.voice_enabled) throw new Error("personal_ai_voice_disabled");

  const thread = await resolveThread(supabase, userId, body);

  const { error: userTurnError } = await supabase.from("personal_ai_turns").insert({
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
  if (userTurnError) throw new Error(`personal_ai_user_turn_write_failed:${userTurnError.message}`);

  const context = await collectContext(supabase, userId, thread.id, input, profile);
  const contextText = buildContextText(context, thread.continuity_summary);
  const system = buildSystemPrompt(profile, body.metadata || {});
  const modelName = process.env.PANTAVION_AI_MODEL?.trim() || "openai/gpt-5.6-sol";
  const gatewayConfigured = Boolean(process.env.AI_GATEWAY_API_KEY?.trim());

  let reply: string;
  let truthState: PersonalAITruthState;
  let provider: string;
  let status: "completed" | "blocked";

  if (gatewayConfigured) {
    try {
      const result = await generateText({
        model: gateway(modelName),
        system,
        prompt: `${contextText}\n\nCURRENT USER INPUT:\n${input}`,
      });
      reply = cleanText(result.text, 30000) || "I could not produce a response for this request.";
      truthState = "UNVERIFIED";
      provider = `vercel-ai-gateway:${modelName}`;
      status = "completed";
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_provider_error";
      reply = "Το Personal AI αποθήκευσε το μήνυμα και τη συνέχεια, αλλά ο εξωτερικός AI provider απέτυχε. Δεν θα παρουσιάσω ψεύτικη απάντηση ως επιτυχία.";
      truthState = "BLOCKED";
      provider = `vercel-ai-gateway:${modelName}`;
      status = "blocked";
      await supabase.from("personal_ai_action_audit").insert({
        user_id: userId,
        thread_id: thread.id,
        action_type: "personal_ai_provider_error",
        status: "failed",
        truth_state: "BLOCKED",
        provider,
        input_summary: input.slice(0, 1000),
        output_summary: message.slice(0, 2000),
      });
    }
  } else {
    const fallback = executePantavionIntent(input);
    reply = `Το προσωπικό AI context και η μνήμη καταγράφηκαν πραγματικά. Η παραγωγική απάντηση από μοντέλο είναι BLOCKED επειδή δεν έχει ρυθμιστεί AI_GATEWAY_API_KEY. Προσωρινή deterministic ταξινόμηση: ${fallback.intentClass} → ${fallback.capabilityFamily}.`;
    truthState = "BLOCKED";
    provider = "not_configured";
    status = "blocked";
  }

  const { error: assistantTurnError } = await supabase.from("personal_ai_turns").insert({
    user_id: userId,
    thread_id: thread.id,
    role: "assistant",
    content: reply,
    input_mode: "text",
    metadata: { provider, model: gatewayConfigured ? modelName : null },
    truth_state: truthState,
  });
  if (assistantTurnError) throw new Error(`personal_ai_assistant_turn_write_failed:${assistantTurnError.message}`);

  const continuitySummary = nextContinuitySummary(thread.continuity_summary, input, reply);
  const { error: threadUpdateError } = await supabase
    .from("personal_ai_threads")
    .update({ continuity_summary: continuitySummary, last_activity_at: new Date().toISOString() })
    .eq("id", thread.id)
    .eq("user_id", userId);
  if (threadUpdateError) throw new Error(`personal_ai_thread_update_failed:${threadUpdateError.message}`);

  const { error: auditError } = await supabase.from("personal_ai_action_audit").insert({
    user_id: userId,
    thread_id: thread.id,
    action_type: "personal_ai_response",
    status,
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
  if (auditError) throw new Error(`personal_ai_audit_write_failed:${auditError.message}`);

  return {
    ok: true,
    personalAiId: profile.personal_ai_id,
    threadId: thread.id,
    parentThreadId: thread.parent_thread_id,
    reply,
    provider,
    truthState,
    executionStatus: status,
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
  const [threads, memories, items, relationships] = await Promise.all([
    supabase.from("personal_ai_threads").select("id,parent_thread_id,title,continuity_summary,status,last_activity_at").eq("user_id", userId).order("last_activity_at", { ascending: false }).limit(30),
    supabase.from("personal_ai_memories").select("id,thread_id,memory_type,scope,content,source_type,source_ref,confidence,truth_state,updated_at").eq("user_id", userId).is("deleted_at", null).order("updated_at", { ascending: false }).limit(50),
    supabase.from("personal_ai_items").select("id,thread_id,kind,title,body,subject_label,due_at,recurrence,status,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50),
    supabase.from("personal_ai_relationship_contexts").select("id,subject_key,display_name,relationship_type,aliases,notes,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50),
  ]);

  for (const result of [threads, memories, items, relationships]) {
    if (result.error) throw new Error(`personal_ai_state_read_failed:${result.error.message}`);
  }

  return {
    ok: true,
    profile,
    threads: threads.data || [],
    memories: memories.data || [],
    items: items.data || [],
    relationships: relationships.data || [],
  };
}
