import type { SupabaseClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

type ThreadRow = {
  id: string;
  title: string | null;
  state: unknown;
  status: string;
  last_activity_at: string;
};

type TurnRow = {
  id: string;
  role: string;
  content: string;
  attachments: unknown;
  created_at: string;
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
  subject_key: string;
  display_name: string;
  relationship_type: string;
  aliases: string[] | null;
};

type SafeAttachmentMetadata = {
  name: string;
  mediaType: string;
  size: number | null;
  sha256: string | null;
};

export type PersonalAIConversationIndex = {
  version: 1;
  generatedAt: string;
  threadId: string;
  title: string | null;
  truthState: "KNOWN";
  sourceBoundToSameUser: true;
  topics: Array<{ term: string; count: number; turnIds: string[] }>;
  entities: Array<{
    subjectKey: string;
    displayName: string;
    relationshipType: string;
    matchedAliases: string[];
    turnIds: string[];
  }>;
  decisions: Array<{ turnId: string; role: string; text: string; createdAt: string }>;
  openTasks: Array<{ itemId: string; kind: string; title: string; dueAt: string | null }>;
  dates: Array<{ value: string; turnIds: string[] }>;
  attachments: Array<SafeAttachmentMetadata & { turnId: string }>;
  status: {
    threadStatus: string;
    lastActivityAt: string;
    indexedTurnCount: number;
    openTaskCount: number;
    attachmentCount: number;
  };
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "i", "if", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "was", "we", "with", "you", "your",
  "και", "να", "το", "τα", "τη", "την", "της", "του", "των", "σε", "στο", "στη", "στην", "με", "για", "από", "που", "πως", "πώς", "τι", "θα", "είναι", "εχω", "έχω", "εχει", "έχει", "μου", "σου", "μας", "σας", "αυτό", "αυτο", "αλλά", "αλλα", "οτι", "ότι",
]);

const DECISION_PATTERN = /\b(αποφασ|εγκρ|συμφων|κλειδ|οριστικ|accept|accepted|approve|approved|agreed|decision|decided|finalize|finalized)\w*/iu;
const DATE_PATTERN = /\b(?:20\d{2}-\d{1,2}-\d{1,2}|\d{1,2}[/.\-]\d{1,2}(?:[/.\-]\d{2,4})?)\b/g;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function normalized(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function tokens(value: string) {
  return normalized(value)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function buildTopics(turns: TurnRow[]) {
  const entries = new Map<string, { count: number; turnIds: Set<string> }>();
  for (const turn of turns) {
    const perTurn = new Set(tokens(turn.content));
    for (const token of perTurn) {
      const current = entries.get(token) || { count: 0, turnIds: new Set<string>() };
      current.count += 1;
      current.turnIds.add(turn.id);
      entries.set(token, current);
    }
  }

  return Array.from(entries.entries())
    .map(([term, value]) => ({ term, count: value.count, turnIds: Array.from(value.turnIds).slice(-12) }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, 18);
}

function buildEntities(turns: TurnRow[], relationships: RelationshipRow[]) {
  const normalizedTurns = turns.map((turn) => ({ ...turn, normalizedContent: normalized(turn.content) }));
  return relationships
    .map((relationship) => {
      const candidates = [relationship.display_name, ...(relationship.aliases || [])]
        .map((value) => normalized(value))
        .filter((value) => value.length > 1);
      const turnIds = normalizedTurns
        .filter((turn) => candidates.some((candidate) => turn.normalizedContent.includes(candidate)))
        .map((turn) => turn.id);
      const matchedAliases = candidates.filter((candidate) => normalizedTurns.some((turn) => turn.normalizedContent.includes(candidate)));
      return {
        subjectKey: relationship.subject_key,
        displayName: relationship.display_name,
        relationshipType: relationship.relationship_type,
        matchedAliases: Array.from(new Set(matchedAliases)).slice(0, 8),
        turnIds: Array.from(new Set(turnIds)).slice(-16),
      };
    })
    .filter((entity) => entity.turnIds.length > 0)
    .slice(0, 24);
}

function buildDecisions(turns: TurnRow[]) {
  return turns
    .filter((turn) => DECISION_PATTERN.test(turn.content))
    .slice(-20)
    .map((turn) => ({
      turnId: turn.id,
      role: turn.role,
      text: clean(turn.content, 700),
      createdAt: turn.created_at,
    }));
}

function buildDates(turns: TurnRow[]) {
  const found = new Map<string, Set<string>>();
  for (const turn of turns) {
    const values = turn.content.match(DATE_PATTERN) || [];
    for (const value of values) {
      const bucket = found.get(value) || new Set<string>();
      bucket.add(turn.id);
      found.set(value, bucket);
    }
  }
  return Array.from(found.entries())
    .map(([value, turnIds]) => ({ value, turnIds: Array.from(turnIds).slice(-12) }))
    .slice(0, 30);
}

function safeAttachments(value: unknown): SafeAttachmentMetadata[] {
  if (!Array.isArray(value)) return [];
  const output: SafeAttachmentMetadata[] = [];
  for (const entry of value.slice(0, 24)) {
    const record = asRecord(entry);
    const name = clean(record.name, 160);
    const mediaType = clean(record.mediaType, 100);
    if (!name && !mediaType) continue;
    const sizeValue = typeof record.size === "number" && Number.isFinite(record.size) ? Math.max(0, Math.round(record.size)) : null;
    const sha256 = /^[a-f0-9]{64}$/i.test(clean(record.sha256, 64)) ? clean(record.sha256, 64).toLowerCase() : null;
    output.push({ name: name || "attachment", mediaType: mediaType || "unknown", size: sizeValue, sha256 });
  }
  return output;
}

function buildAttachments(turns: TurnRow[]) {
  return turns.flatMap((turn) => safeAttachments(turn.attachments).map((attachment) => ({ turnId: turn.id, ...attachment }))).slice(-60);
}

function buildOpenTasks(items: ItemRow[]) {
  return items
    .filter((item) => item.status === "open")
    .slice(0, 40)
    .map((item) => ({
      itemId: item.id,
      kind: item.kind,
      title: clean(item.title || item.body, 300) || item.kind,
      dueAt: item.due_at,
    }));
}

export function extractConversationIndexSearchText(state: unknown) {
  const index = asRecord(asRecord(state).conversationIndex);
  if (index.version !== 1) return "";
  const topics = Array.isArray(index.topics) ? index.topics.map((entry) => clean(asRecord(entry).term, 100)).filter(Boolean) : [];
  const entities = Array.isArray(index.entities) ? index.entities.map((entry) => clean(asRecord(entry).displayName, 160)).filter(Boolean) : [];
  const decisions = Array.isArray(index.decisions) ? index.decisions.map((entry) => clean(asRecord(entry).text, 500)).filter(Boolean) : [];
  const tasks = Array.isArray(index.openTasks) ? index.openTasks.map((entry) => clean(asRecord(entry).title, 300)).filter(Boolean) : [];
  const dates = Array.isArray(index.dates) ? index.dates.map((entry) => clean(asRecord(entry).value, 80)).filter(Boolean) : [];
  const attachments = Array.isArray(index.attachments) ? index.attachments.map((entry) => clean(asRecord(entry).name, 160)).filter(Boolean) : [];
  return [topics.join(" "), entities.join(" "), decisions.join(" "), tasks.join(" "), dates.join(" "), attachments.join(" ")].filter(Boolean).join(" ").slice(0, 12000);
}

export function conversationIndexPublicSummary(state: unknown) {
  const index = asRecord(asRecord(state).conversationIndex);
  if (index.version !== 1) return null;
  return {
    version: 1,
    generatedAt: clean(index.generatedAt, 64) || null,
    topics: Array.isArray(index.topics) ? index.topics.slice(0, 12).map((entry) => clean(asRecord(entry).term, 100)).filter(Boolean) : [],
    entities: Array.isArray(index.entities) ? index.entities.slice(0, 12).map((entry) => clean(asRecord(entry).displayName, 160)).filter(Boolean) : [],
    decisionCount: Array.isArray(index.decisions) ? index.decisions.length : 0,
    openTaskCount: Array.isArray(index.openTasks) ? index.openTasks.length : 0,
    attachmentCount: Array.isArray(index.attachments) ? index.attachments.length : 0,
  };
}

export async function buildAndPersistPersonalAIConversationIndex(
  supabase: SupabaseClient,
  userId: string,
  threadId: string,
): Promise<PersonalAIConversationIndex> {
  const threadResult = await supabase
    .from("personal_ai_threads")
    .select("id,title,state,status,last_activity_at")
    .eq("id", threadId)
    .eq("user_id", userId)
    .single();
  if (threadResult.error || !threadResult.data) throw new Error("personal_ai_conversation_index_thread_not_found");
  const thread = threadResult.data as ThreadRow;

  const turnsResult = await supabase
    .from("personal_ai_turns")
    .select("id,role,content,attachments,created_at")
    .eq("user_id", userId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(120);
  if (turnsResult.error) throw new Error(`personal_ai_conversation_index_turns_failed:${turnsResult.error.message}`);
  const turns = ((turnsResult.data || []) as TurnRow[]).reverse();

  const itemsResult = await supabase
    .from("personal_ai_items")
    .select("id,kind,title,body,due_at,status")
    .eq("user_id", userId)
    .eq("thread_id", threadId)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (itemsResult.error) throw new Error(`personal_ai_conversation_index_items_failed:${itemsResult.error.message}`);
  const items = (itemsResult.data || []) as ItemRow[];

  const relationshipsResult = await supabase
    .from("personal_ai_relationship_contexts")
    .select("subject_key,display_name,relationship_type,aliases")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (relationshipsResult.error) throw new Error(`personal_ai_conversation_index_relationships_failed:${relationshipsResult.error.message}`);
  const relationships = (relationshipsResult.data || []) as RelationshipRow[];

  const attachments = buildAttachments(turns);
  const openTasks = buildOpenTasks(items);
  const index: PersonalAIConversationIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    threadId,
    title: thread.title,
    truthState: "KNOWN",
    sourceBoundToSameUser: true,
    topics: buildTopics(turns),
    entities: buildEntities(turns, relationships),
    decisions: buildDecisions(turns),
    openTasks,
    dates: buildDates(turns),
    attachments,
    status: {
      threadStatus: thread.status,
      lastActivityAt: thread.last_activity_at,
      indexedTurnCount: turns.length,
      openTaskCount: openTasks.length,
      attachmentCount: attachments.length,
    },
  };

  const existingState = asRecord(thread.state);
  const updated = await supabase
    .from("personal_ai_threads")
    .update({ state: { ...existingState, conversationIndex: index } })
    .eq("id", threadId)
    .eq("user_id", userId);
  if (updated.error) throw new Error(`personal_ai_conversation_index_write_failed:${updated.error.message}`);

  const audit = await supabase.from("personal_ai_action_audit").insert({
    user_id: userId,
    thread_id: threadId,
    action_type: "personal_ai_conversation_index_rebuilt",
    status: "completed",
    truth_state: "KNOWN",
    provider: "deterministic-conversation-index-v1",
    input_summary: `thread:${threadId}; turns:${turns.length}`,
    output_summary: `topics:${index.topics.length}; entities:${index.entities.length}; decisions:${index.decisions.length}; tasks:${index.openTasks.length}; attachments:${index.attachments.length}`,
    metadata: {
      version: 1,
      sourceBoundToSameUser: true,
      turnIds: turns.map((turn) => turn.id),
      itemIds: openTasks.map((item) => item.itemId),
    },
  });
  if (audit.error) throw new Error(`personal_ai_conversation_index_audit_failed:${audit.error.message}`);

  return index;
}
