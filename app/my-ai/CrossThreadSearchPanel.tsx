"use client";

import { FormEvent, useState } from "react";

type Source = {
  threadId: string;
  title: string | null;
  continuitySummary: string;
  lastActivityAt: string;
  relevanceScore: number;
  matchedTerms: string[];
  representativeTurns: Array<{
    turnId: string;
    role: string;
    content: string;
    createdAt: string;
    relevanceScore: number;
  }>;
};

type SearchPayload = {
  ok?: boolean;
  retrieval?: {
    mode: string;
    userBound: boolean;
    searchedThreadCount: number;
    searchedTurnCount: number;
    sources: Source[];
  };
  error?: string;
  detail?: string;
};

export default function CrossThreadSearchPanel() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SearchPayload["retrieval"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/personal-ai/thread-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: value }),
      });
      const payload = (await response.json().catch(() => ({}))) as SearchPayload;
      if (!response.ok || !payload.ok || !payload.retrieval) {
        throw new Error(payload.detail || payload.error || `thread_search_failed_${response.status}`);
      }
      setResult(payload.retrieval);
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "thread_search_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pv-panel">
      <p className="pv-kicker">Cross-thread memory · v6</p>
      <h2>Βρες τι υπάρχει στις προηγούμενες συνομιλίες.</h2>
      <p className="pv-muted">
        Η αναζήτηση περιορίζεται στα δικά σου Personal AI threads. Δεν επιστρέφει απλώς τα πιο πρόσφατα:
        απαιτεί πραγματικό relevance match και δείχνει την πηγή μέχρι το συγκεκριμένο turn.
      </p>

      <form onSubmit={search} style={{ display: "grid", gap: 10 }}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="π.χ. τι είχαμε αποφασίσει για τη μετάφραση;"
        />
        <button className="pv-button blue" type="submit" disabled={busy || !query.trim()}>
          {busy ? "Αναζήτηση..." : "Αναζήτηση στα νήματά μου"}
        </button>
      </form>

      {result ? (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <small>
            mode: {result.mode} · user-bound: {String(result.userBound)} · searched threads: {result.searchedThreadCount} · turns: {result.searchedTurnCount}
          </small>
          {result.sources.length === 0 ? (
            <div className="pv-card">
              <strong>Δεν βρέθηκε σχετικό νήμα.</strong>
              <p style={{ marginBottom: 0 }}>Το σύστημα δεν πρόσθεσε άσχετη πρόσφατη συνομιλία ως υποκατάστατο.</p>
            </div>
          ) : null}
          {result.sources.map((source) => (
            <div className="pv-card" key={source.threadId}>
              <span className="pv-status gold">relevance {source.relevanceScore}</span>
              <h3>{source.title || "Χωρίς τίτλο"}</h3>
              <small>thread: {source.threadId}</small>
              <p><strong>Matched:</strong> {source.matchedTerms.join(", ") || "—"}</p>
              {source.continuitySummary ? <p style={{ whiteSpace: "pre-wrap" }}>{source.continuitySummary}</p> : null}
              {source.representativeTurns.map((turn) => (
                <div key={turn.turnId} style={{ marginTop: 10 }}>
                  <small>{turn.role} · turn {turn.turnId} · relevance {turn.relevanceScore}</small>
                  <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{turn.content}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="pv-card" style={{ marginTop: 12 }}>
          <span className="pv-status">SEARCH BLOCKED</span>
          <p style={{ marginBottom: 0 }}>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
