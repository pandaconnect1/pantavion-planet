"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Props = {
  displayName: string;
  language: string | null;
  country: string | null;
};

type StatePayload = {
  profile?: {
    personal_ai_id: string;
    cross_thread_enabled: boolean;
    memory_enabled: boolean;
  };
  memories?: Array<{ id: string; memory_type: string; content: string; truth_state: string }>;
  items?: Array<{ id: string; kind: string; title: string | null; body: string; due_at: string | null; status: string }>;
  relationships?: Array<{ id: string; display_name: string; relationship_type: string; notes: string }>;
};

type MemoryHealthPayload = {
  health?: {
    score: number;
    status: string;
    expiredCount: number;
    reviewSuggestedCount: number;
    possibleConflictCount: number;
    supersessionLinkCount: number;
  };
  truth?: string;
};

type ContextCapsule = {
  sourceThreadId: string;
  generatedAt: string;
  continuitySummary: string;
  integrity?: {
    turnCountCaptured?: number;
    memoryCountCaptured?: number;
    openItemCountCaptured?: number;
    relationshipCountCaptured?: number;
  };
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  truthState?: string;
};

async function getPayload(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 503) {
    throw new Error(data?.detail || data?.error || `request_failed_${response.status}`);
  }
  return data;
}

export default function PersonalAIConsole({ displayName, language, country }: Props) {
  const [state, setState] = useState<StatePayload>({});
  const [memoryHealth, setMemoryHealth] = useState<MemoryHealthPayload>({});
  const [threadId, setThreadId] = useState<string | null>(null);
  const [lastCapsule, setLastCapsule] = useState<ContextCapsule | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [memoryText, setMemoryText] = useState("");
  const [itemKind, setItemKind] = useState("note");
  const [itemTitle, setItemTitle] = useState("");
  const [relationName, setRelationName] = useState("");
  const [relationType, setRelationType] = useState("friend");
  const [relationNotes, setRelationNotes] = useState("");
  const [handsFree, setHandsFree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [stateData, healthData] = await Promise.all([
      getPayload(await fetch("/api/personal-ai/state", { cache: "no-store" })),
      getPayload(await fetch("/api/personal-ai/memory-health", { cache: "no-store" })),
    ]);
    setState(stateData);
    setMemoryHealth(healthData);
  }, []);

  useEffect(() => {
    refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "state_failed"));
  }, [refresh]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    setBusy(true);
    setError(null);
    setInput("");
    setMessages((current) => [...current, { role: "user", content: text }]);

    try {
      const data = await getPayload(await fetch("/api/personal-ai/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: text,
          threadId,
          inputMode: handsFree ? "voice" : "text",
          originalLanguage: language,
          metadata: { driving: handsFree, handsFree },
        }),
      }));

      if (typeof data.threadId === "string") setThreadId(data.threadId);
      setMessages((current) => [...current, {
        role: "assistant",
        content: data.reply || "No response returned.",
        truthState: data.truthState || "UNVERIFIED",
      }]);
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "personal_ai_failed";
      setError(message);
      setMessages((current) => [...current, { role: "assistant", content: message, truthState: "BLOCKED" }]);
    } finally {
      setBusy(false);
    }
  }

  async function handoffThread() {
    if (!threadId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await getPayload(await fetch("/api/personal-ai/handoff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceThreadId: threadId }),
      }));
      if (typeof data?.thread?.id !== "string") throw new Error("handoff_thread_missing");
      setThreadId(data.thread.id);
      setLastCapsule(data.capsule || null);
      setMessages([]);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "handoff_failed");
    } finally {
      setBusy(false);
    }
  }

  async function remember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = memoryText.trim();
    if (!content) return;
    setError(null);
    try {
      await getPayload(await fetch("/api/personal-ai/memory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content,
          threadId,
          memoryType: "semantic",
          scope: "private",
          truthState: "KNOWN",
          sourceType: "user_explicit",
          sourceRef: threadId ? `thread:${threadId}` : "my-ai",
        }),
      }));
      setMemoryText("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "memory_failed");
    }
  }

  async function forget(id: string) {
    setError(null);
    try {
      await getPayload(await fetch("/api/personal-ai/memory", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      }));
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "forget_failed");
    }
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = itemTitle.trim();
    if (!title) return;
    setError(null);
    try {
      await getPayload(await fetch("/api/personal-ai/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: itemKind, title, threadId }),
      }));
      setItemTitle("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "item_failed");
    }
  }

  async function addRelationship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = relationName.trim();
    const relationshipType = relationType.trim();
    if (!displayName || !relationshipType) return;
    setError(null);
    try {
      await getPayload(await fetch("/api/personal-ai/relationships", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName,
          relationshipType,
          notes: relationNotes.trim(),
        }),
      }));
      setRelationName("");
      setRelationNotes("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "relationship_failed");
    }
  }

  const health = memoryHealth.health;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div className="pv-panel">
        <span className="pv-status gold">Per-user Personal AI</span>
        <h2>{displayName}</h2>
        <p className="pv-muted">
          {country || "Country not set"} · {language || "language auto"} · {state.profile?.personal_ai_id || "initializing"}
        </p>
        <div className="pv-actions">
          <button className="pv-button" type="button" onClick={() => setHandsFree((value) => !value)}>
            Hands-free: {handsFree ? "ON" : "OFF"}
          </button>
          <button className="pv-button blue" type="button" disabled={!threadId || busy} onClick={handoffThread}>
            Νέο νήμα με Context Capsule
          </button>
        </div>
      </div>

      {lastCapsule ? (
        <div className="pv-panel">
          <p className="pv-kicker">Context Capsule v2</p>
          <h3>Η συνέχεια μεταφέρθηκε χωρίς να ξαναρχίσει από το μηδέν.</h3>
          <p className="pv-muted" style={{ whiteSpace: "pre-wrap" }}>{lastCapsule.continuitySummary}</p>
          <small>
            turns {lastCapsule.integrity?.turnCountCaptured || 0} · memories {lastCapsule.integrity?.memoryCountCaptured || 0} · open items {lastCapsule.integrity?.openItemCountCaptured || 0} · relationships {lastCapsule.integrity?.relationshipCountCaptured || 0}
          </small>
        </div>
      ) : null}

      <div className="pv-panel">
        <p className="pv-kicker">Conversation</p>
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {messages.length === 0 ? <p className="pv-muted">Γράψε φυσικά όπως μιλάς.</p> : null}
          {messages.map((message, index) => (
            <div className="pv-card" key={`${message.role}-${index}`}>
              <span className="pv-status">{message.role}{message.truthState ? ` · ${message.truthState}` : ""}</span>
              <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{message.content}</p>
            </div>
          ))}
        </div>
        <form onSubmit={send} style={{ display: "grid", gap: 10 }}>
          <textarea rows={4} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Μίλα στο Personal AI..." />
          <button className="pv-button gold" type="submit" disabled={busy || !input.trim()}>{busy ? "Εκτέλεση..." : "Αποστολή"}</button>
        </form>
      </div>

      {error ? <div className="pv-panel"><span className="pv-status">BLOCKED</span><p>{error}</p></div> : null}

      <div className="pv-grid">
        <div className="pv-card">
          <p className="pv-kicker">Memory Health</p>
          <h3>{health ? `${health.score}/100 · ${health.status}` : "Έλεγχος μνήμης"}</h3>
          {health ? (
            <p>
              Ληγμένες: {health.expiredCount} · review: {health.reviewSuggestedCount} · πιθανές συγκρούσεις: {health.possibleConflictCount} · supersession links: {health.supersessionLinkCount}
            </p>
          ) : <p className="pv-muted">Φόρτωση...</p>}
          <small>{memoryHealth.truth || "Δεν αλλάζει μνήμες αυτόματα."}</small>
        </div>

        <div className="pv-card">
          <p className="pv-kicker">Memory</p>
          <h3>Θυμήσου / ξέχνα</h3>
          <form onSubmit={remember} style={{ display: "grid", gap: 8 }}>
            <textarea rows={3} value={memoryText} onChange={(event) => setMemoryText(event.target.value)} placeholder="Κάτι που θέλεις να θυμάται..." />
            <button className="pv-button" type="submit">Αποθήκευση μνήμης</button>
          </form>
          {(state.memories || []).slice(0, 6).map((memory) => (
            <div key={memory.id} style={{ marginTop: 10 }}>
              <small>{memory.memory_type} · {memory.truth_state}</small>
              <p>{memory.content}</p>
              <button className="pv-button" type="button" onClick={() => forget(memory.id)}>Ξέχνα το</button>
            </div>
          ))}
        </div>

        <div className="pv-card">
          <p className="pv-kicker">Life items</p>
          <h3>Σημειώσεις και υποχρεώσεις</h3>
          <form onSubmit={addItem} style={{ display: "grid", gap: 8 }}>
            <select value={itemKind} onChange={(event) => setItemKind(event.target.value)}>
              <option value="note">Σημείωση</option>
              <option value="birthday">Γενέθλια</option>
              <option value="appointment">Ραντεβού</option>
              <option value="reminder">Υπενθύμιση</option>
              <option value="task">Εργασία</option>
              <option value="follow_up">Follow-up</option>
              <option value="important_date">Σημαντική ημερομηνία</option>
            </select>
            <input value={itemTitle} onChange={(event) => setItemTitle(event.target.value)} placeholder="Τι να κρατήσω;" />
            <button className="pv-button" type="submit">Καταγραφή</button>
          </form>
          {(state.items || []).filter((item) => item.status === "open").slice(0, 6).map((item) => (
            <div key={item.id} style={{ marginTop: 10 }}><small>{item.kind}</small><p>{item.title || item.body}</p></div>
          ))}
        </div>

        <div className="pv-card">
          <p className="pv-kicker">Relationship context</p>
          <h3>Ποιος είναι ποιος</h3>
          <form onSubmit={addRelationship} style={{ display: "grid", gap: 8 }}>
            <input value={relationName} onChange={(event) => setRelationName(event.target.value)} placeholder="Όνομα" />
            <input value={relationType} onChange={(event) => setRelationType(event.target.value)} placeholder="π.χ. συνάδελφος, φίλος, πατέρας" />
            <textarea rows={3} value={relationNotes} onChange={(event) => setRelationNotes(event.target.value)} placeholder="Σχετικό context" />
            <button className="pv-button" type="submit">Αποθήκευση σχέσης</button>
          </form>
          {(state.relationships || []).slice(0, 6).map((relation) => (
            <div key={relation.id} style={{ marginTop: 10 }}><small>{relation.relationship_type}</small><p><strong>{relation.display_name}</strong> {relation.notes}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}
