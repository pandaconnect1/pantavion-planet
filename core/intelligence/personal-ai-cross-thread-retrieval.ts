import type { SupabaseClient } from "@supabase/supabase-js";

type ThreadRow = {
  id: string;
  title: string | null;
  continuity_summary: string;
  status: string;
  last_activity_at: string;
};

type TurnRow = {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  created_at: string;
};

export type PersonalAICrossThreadSource = {
  sourceType: "personal_ai_thread";
  threadId: string;
  title: string | null;
  continuitySummary: string;
  status: string;
  lastActivityAt: string;
  relevanceScore: number;
  lexicalScore: number;
  recencyScore: number;
  matchedTerms: string[];
  representativeTurns: Array<{
    turnId: string;
    role: string;
    content: string;
    createdAt: string;
    relevanceScore: number;
  }>;
};

export type PersonalAICrossThreadRetrieval = {
  query: string;
  mode: "lexical_recency_v1";
  userBound: true;
  currentThreadExcluded: boolean;
  searchedThreadCount: number;
  searchedTurnCount: number;
  sources: PersonalAICrossThreadSource[];
};

const MAX_CANDIDATE_THREADS = 80;
const MAX_CANDIDATE_TURNS = 600;
const MAX_SOURCES = 8;
const MAX_TURNS_PER_SOURCE = 3;
const MIN_LEXICAL_SCORE = 0.08;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "i", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "we", "with", "you",
  "και", "να", "το", "τα", "τη", "την", "της", "του", "των", "σε", "στο", "στη", "στην", "με", "για", "από", "που", "πως", "πώς", "τι", "θα", "είναι", "εχω", "έχω", "εχει", "έχει", "μου", "σου", "μας", "σας",
]);

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function tokenize(value: string) {
  const normalized = value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  if (!normalized) return [];
  return normalized
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .slice(0, 120);
}

function uniqueTokens(value: string) {
  return Array.from(new Set(tokenize(value)));
}

function lexicalRelevance(queryTokens: string[], candidate: string) {
  if (!queryTokens.length) return { score: 0, matchedTerms: [] as string[] };
  const candidateTokens = new Set(uniqueTokens(candidate));
  const matchedTerms = queryTokens.filter((token) => candidateTokens.has(token));
  if (!matchedTerms.length) return { score: 0, matchedTerms };

  const coverage = matchedTerms.length / queryTokens.length;
  const precision = matchedTerms.length / Math.max(1, Math.min(candidateTokens.size, 40));
  const score = Math.min(1, coverage * 0.82 + precision * 0.18);
  return { score, matchedTerms };
}

function recencyScore(lastActivityAt: string) {
  const timestamp = Date.parse(lastActivityAt);
  if (!Number.isFinite(timestamp)) return 0;
  const ageDays = Math.max(0, (Date.now() - timestamp) / 86_400_000);
  return Math.max(0, Math.min(1, Math.exp(-ageDays / 45)));
}

function rounded(value: number) {
  return Math.round(value * 1000) / 1000;
}

function representativeTurns(queryTokens: string[], turns: TurnRow[]) {
  return turns
    .map((turn) => {
      const relevance = lexicalRelevance(queryTokens, turn.content);
      return { turn, score: relevance.score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(b.turn.created_at) - Date.parse(a.turn.created_at))
    .slice(0, MAX_TURNS_PER_SOURCE)
    .map(({ turn, score }) => ({
      turnId: turn.id,
      role: turn.role,
      content: clean(turn.content, 900),
      createdAt: turn.created_at,
      relevanceScore: rounded(score),
    }));
}

export async function retrieveRelevantPersonalAIThreads(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  currentThreadId?: string | null,
): Promise<PersonalAICrossThreadRetrieval> {
  const normalizedQuery = clean(query, 8_000);
  const queryTokens = uniqueTokens(normalizedQuery);
  if (!normalizedQuery || !queryTokens.length) {
    return {
      query: normalizedQuery,
      mode: "lexical_recency_v1",
      userBound: true,
      currentThreadExcluded: Boolean(currentThreadId),
      searchedThreadCount: 0,
      searchedTurnCount: 0,
      sources: [],
    };
  }

  let threadQuery = supabase
    .from("personal_ai_threads")
    .select("id,title,continuity_summary,status,last_activity_at")
    .eq("user_id", userId)
    .order("last_activity_at", { ascending: false })
    .limit(MAX_CANDIDATE_THREADS);
  if (currentThreadId) threadQuery = threadQuery.neq("id", currentThreadId);

  const threadsResult = await threadQuery;
  if (threadsResult.error) throw new Error(`personal_ai_cross_thread_threads_failed:${threadsResult.error.message}`);
  const threads = (threadsResult.data || []) as ThreadRow[];
  if (!threads.length) {
    return {
      query: normalizedQuery,
      mode: "lexical_recency_v1",
      userBound: true,
      currentThreadExcluded: Boolean(currentThreadId),
      searchedThreadCount: 0,
      searchedTurnCount: 0,
      sources: [],
    };
  }

  const candidateIds = threads.map((thread) => thread.id);
  const turnsResult = await supabase
    .from("personal_ai_turns")
    .select("id,thread_id,role,content,created_at")
    .eq("user_id", userId)
    .in("thread_id", candidateIds)
    .order("created_at", { ascending: false })
    .limit(MAX_CANDIDATE_TURNS);
  if (turnsResult.error) throw new Error(`personal_ai_cross_thread_turns_failed:${turnsResult.error.message}`);
  const turns = (turnsResult.data || []) as TurnRow[];

  const turnsByThread = new Map<string, TurnRow[]>();
  for (const turn of turns) {
    const bucket = turnsByThread.get(turn.thread_id) || [];
    bucket.push(turn);
    turnsByThread.set(turn.thread_id, bucket);
  }

  const sources = threads
    .map((thread) => {
      const threadTurns = turnsByThread.get(thread.id) || [];
      const searchable = [
        thread.title || "",
        thread.continuity_summary || "",
        ...threadTurns.slice(0, 16).map((turn) => turn.content),
      ].join(" ");
      const lexical = lexicalRelevance(queryTokens, searchable);
      const recency = recencyScore(thread.last_activity_at);
      const relevanceScore = lexical.score > 0
        ? Math.min(1, lexical.score * 0.9 + recency * 0.1)
        : 0;

      return {
        sourceType: "personal_ai_thread" as const,
        threadId: thread.id,
        title: thread.title,
        continuitySummary: clean(thread.continuity_summary, 2_400),
        status: thread.status,
        lastActivityAt: thread.last_activity_at,
        relevanceScore: rounded(relevanceScore),
        lexicalScore: rounded(lexical.score),
        recencyScore: rounded(recency),
        matchedTerms: Array.from(new Set(lexical.matchedTerms)).slice(0, 20),
        representativeTurns: representativeTurns(queryTokens, threadTurns),
      } satisfies PersonalAICrossThreadSource;
    })
    .filter((source) => source.lexicalScore >= MIN_LEXICAL_SCORE)
    .sort((a, b) => b.relevanceScore - a.relevanceScore || Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt))
    .slice(0, MAX_SOURCES);

  return {
    query: normalizedQuery,
    mode: "lexical_recency_v1",
    userBound: true,
    currentThreadExcluded: Boolean(currentThreadId),
    searchedThreadCount: threads.length,
    searchedTurnCount: turns.length,
    sources,
  };
}
