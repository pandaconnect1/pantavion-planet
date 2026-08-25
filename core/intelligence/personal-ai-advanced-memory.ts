import type { SupabaseClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

type TurnRow = {
  role: string;
  content: string;
  created_at: string;
};

type MemoryRow = {
  id: string;
  thread_id: string | null;
  memory_type: string;
  content: string;
  normalized_content: string | null;
  source_type: string;
  source_ref: string | null;
  confidence: number;
  truth_state: string;
  valid_from: string | null;
  valid_until: string | null;
  supersedes_memory_id: string | null;
  created_at: string;
  updated_at: string;
};

type ItemRow = {
  id: string;
  kind: string;
  title: string | null;
  body: string;
  due_at: string | null;
  status: string;
};

type RelationshipRow = {
  display_name: string;
  relationship_type: string;
  aliases: string[] | null;
  notes: string;
};

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function compact(lines: string[], maxChars: number) {
  let used = 0;
  const output: string[] = [];
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

function normalizeComparable(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function relationshipMentioned(row: RelationshipRow, corpus: string) {
  const candidates = [row.display_name, ...(row.aliases || [])]
    .map((value) => normalizeComparable(value))
    .filter((value) => value.length > 1);
  return candidates.some((value) => corpus.includes(value));
}

export async function createPersonalAIContextHandoff(
  supabase: SupabaseClient,
  userId: string,
  sourceThreadId: string,
) {
  const sourceThread = await supabase
    .from("personal_ai_threads")
    .select("id,title,continuity_summary,last_activity_at")
    .eq("id", sourceThreadId)
    .eq("user_id", userId)
    .single();
  if (sourceThread.error || !sourceThread.data) throw new Error("personal_ai_handoff_source_not_found");

  const turns = await supabase
    .from("personal_ai_turns")
    .select("role,content,created_at")
    .eq("user_id", userId)
    .eq("thread_id", sourceThreadId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (turns.error) throw new Error(`personal_ai_handoff_turns_failed:${turns.error.message}`);

  const memories = await supabase
    .from("personal_ai_memories")
    .select("id,memory_type,content,source_type,source_ref,confidence,truth_state,updated_at")
    .eq("user_id", userId)
    .eq("thread_id", sourceThreadId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(24);
  if (memories.error) throw new Error(`personal_ai_handoff_memories_failed:${memories.error.message}`);

  const items = await supabase
    .from("personal_ai_items")
    .select("id,kind,title,body,due_at,status")
    .eq("user_id", userId)
    .eq("thread_id", sourceThreadId)
    .eq("status", "open")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(24);
  if (items.error) throw new Error(`personal_ai_handoff_items_failed:${items.error.message}`);

  const relationships = await supabase
    .from("personal_ai_relationship_contexts")
    .select("display_name,relationship_type,aliases,notes")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(60);
  if (relationships.error) throw new Error(`personal_ai_handoff_relationships_failed:${relationships.error.message}`);

  const orderedTurns = ((turns.data || []) as TurnRow[]).reverse();
  const threadMemories = (memories.data || []) as Array<Pick<MemoryRow, "memory_type" | "content" | "truth_state">>;
  const openItems = (items.data || []) as ItemRow[];
  const corpus = normalizeComparable(
    [
      sourceThread.data.continuity_summary || "",
      ...orderedTurns.map((row) => row.content),
      ...threadMemories.map((row) => row.content),
    ].join(" "),
  );

  const relevantRelationships = ((relationships.data || []) as RelationshipRow[])
    .filter((row) => relationshipMentioned(row, corpus))
    .slice(0, 16);

  const continuitySummary = compact([
    clean(sourceThread.data.continuity_summary, 3500),
    orderedTurns.length
      ? `RECENT EXCHANGES:\n${orderedTurns.slice(-8).map((row) => `${row.role}: ${clean(row.content, 700)}`).join("\n")}`
      : "",
    threadMemories.length
      ? `THREAD MEMORIES:\n${threadMemories.slice(0, 10).map((row) => `[${row.memory_type}/${row.truth_state}] ${clean(row.content, 500)}`).join("\n")}`
      : "",
    openItems.length
      ? `OPEN ITEMS:\n${openItems.slice(0, 10).map((row) => `[${row.kind}${row.due_at ? ` due ${row.due_at}` : ""}] ${clean(row.title || row.body, 400)}`).join("\n")}`
      : "",
    relevantRelationships.length
      ? `PEOPLE IN CONTEXT:\n${relevantRelationships.map((row) => `${row.display_name} (${row.relationship_type})`).join(", ")}`
      : "",
  ], 6000);

  const generatedAt = new Date().toISOString();
  const capsule = {
    version: 2,
    sourceThreadId,
    sourceTitle: sourceThread.data.title || null,
    sourceLastActivityAt: sourceThread.data.last_activity_at || null,
    generatedAt,
    truthState: "KNOWN",
    continuitySummary,
    lastExchanges: orderedTurns.slice(-12),
    memories: threadMemories.slice(0, 16),
    openItems: openItems.slice(0, 16),
    relationships: relevantRelationships,
    integrity: {
      turnCountCaptured: Math.min(orderedTurns.length, 12),
      memoryCountCaptured: Math.min(threadMemories.length, 16),
      openItemCountCaptured: Math.min(openItems.length, 16),
      relationshipCountCaptured: relevantRelationships.length,
      sourceBoundToSameUser: true,
    },
  };

  const created = await supabase
    .from("personal_ai_threads")
    .insert({
      user_id: userId,
      parent_thread_id: sourceThreadId,
      title: sourceThread.data.title ? `Continuation · ${clean(sourceThread.data.title, 64)}` : "Personal AI continuation",
      continuity_summary: continuitySummary,
      state: {
        handedOffFrom: sourceThreadId,
        contextCapsule: capsule,
      } satisfies JsonRecord,
    })
    .select("id,parent_thread_id,title,continuity_summary,state,last_activity_at")
    .single();
  if (created.error || !created.data) throw new Error(`personal_ai_handoff_create_failed:${created.error?.message || "unknown"}`);

  await supabase.from("personal_ai_action_audit").insert({
    user_id: userId,
    thread_id: created.data.id,
    action_type: "personal_ai_context_handoff",
    status: "completed",
    truth_state: "KNOWN",
    provider: "deterministic-context-capsule-v2",
    input_summary: `source_thread:${sourceThreadId}`,
    output_summary: continuitySummary.slice(0, 1800),
    metadata: capsule.integrity,
  });

  return {
    ok: true,
    thread: created.data,
    capsule,
  };
}

export async function getPersonalAIMemoryHealth(supabase: SupabaseClient, userId: string) {
  const result = await supabase
    .from("personal_ai_memories")
    .select("id,thread_id,memory_type,content,normalized_content,source_type,source_ref,confidence,truth_state,valid_from,valid_until,supersedes_memory_id,created_at,updated_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (result.error) throw new Error(`personal_ai_memory_health_read_failed:${result.error.message}`);

  const memories = (result.data || []) as MemoryRow[];
  const now = Date.now();
  const reviewAgeMs = 180 * 24 * 60 * 60 * 1000;
  const expired = memories.filter((row) => row.valid_until && Date.parse(row.valid_until) < now);
  const reviewSuggested = memories.filter((row) => {
    if (row.valid_until || row.supersedes_memory_id) return false;
    if (!["semantic", "preference", "relationship"].includes(row.memory_type)) return false;
    const updated = Date.parse(row.updated_at);
    return Number.isFinite(updated) && now - updated > reviewAgeMs;
  });

  const supersededIds = new Set(memories.map((row) => row.supersedes_memory_id).filter(Boolean) as string[]);
  const groups = new Map<string, MemoryRow[]>();
  for (const row of memories) {
    if (!row.source_ref || row.supersedes_memory_id || supersededIds.has(row.id)) continue;
    if (row.valid_until && Date.parse(row.valid_until) < now) continue;
    const key = `${row.memory_type}|${row.source_ref}`;
    const bucket = groups.get(key) || [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  const possibleConflicts = Array.from(groups.entries())
    .map(([key, rows]) => {
      const distinct = new Map<string, MemoryRow>();
      for (const row of rows) {
        const comparable = normalizeComparable(row.normalized_content || row.content);
        if (comparable) distinct.set(comparable, row);
      }
      if (distinct.size < 2) return null;
      return {
        key,
        memoryType: rows[0]?.memory_type || "unknown",
        sourceRef: rows[0]?.source_ref || null,
        reason: "same_source_ref_different_active_values",
        memories: Array.from(distinct.values()).map((row) => ({
          id: row.id,
          content: row.content,
          truthState: row.truth_state,
          confidence: row.confidence,
          updatedAt: row.updated_at,
        })),
      };
    })
    .filter(Boolean);

  const lineage = memories
    .filter((row) => row.supersedes_memory_id)
    .map((row) => ({ newerMemoryId: row.id, supersededMemoryId: row.supersedes_memory_id, updatedAt: row.updated_at }));

  const score = Math.max(
    0,
    100 - Math.min(40, expired.length * 5) - Math.min(40, possibleConflicts.length * 10) - Math.min(20, reviewSuggested.length * 2),
  );

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    totalActiveMemories: memories.length,
    health: {
      score,
      status: possibleConflicts.length || expired.length ? "review_needed" : reviewSuggested.length ? "review_suggested" : "healthy",
      expiredCount: expired.length,
      reviewSuggestedCount: reviewSuggested.length,
      possibleConflictCount: possibleConflicts.length,
      supersessionLinkCount: lineage.length,
    },
    expired: expired.map((row) => ({ id: row.id, content: row.content, validUntil: row.valid_until, truthState: row.truth_state })),
    reviewSuggested: reviewSuggested.map((row) => ({ id: row.id, content: row.content, updatedAt: row.updated_at, memoryType: row.memory_type })),
    possibleConflicts,
    supersessionLineage: lineage,
    truth: "Memory Health flags review candidates deterministically. It never rewrites, deletes, verifies or resolves a memory automatically.",
  };
}
