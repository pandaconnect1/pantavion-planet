"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type InterpreterBroadcastTurn = {
  turnId: string;
  speaker: "A" | "B";
  sourceCode: string;
  targetCode: string;
  sourceText: string;
  translatedText: string;
  createdAt: string;
};

export type InterpreterBroadcastFunction = (
  turn: InterpreterBroadcastTurn,
) => Promise<boolean>;

type SessionRole = "host" | "guest";
type ConnectionState = "idle" | "connecting" | "live" | "error" | "closed";
type AuthState = "checking" | "ready" | "signed_out";

type TwoDeviceSession = {
  sessionId: string;
  topic: string;
  languageA: string;
  languageB: string;
  expiresAt: string;
  pairingExpiresAt?: string;
  role: SessionRole;
};

type SessionRpcResult = {
  ok?: boolean;
  error?: string;
  sessionId?: string;
  pairingCode?: string;
  topic?: string;
  languageA?: string;
  languageB?: string;
  pairingExpiresAt?: string;
  expiresAt?: string;
  role?: string;
};

type PersistedSessionRow = {
  id: string;
  language_a: string;
  language_b: string;
  status: string;
  expires_at: string;
};

type MembershipRow = { role: string };

const STORED_SESSION_KEY = "pantavion-interpreter-session-id";
const DEVICE_ID_KEY = "pantavion-interpreter-device-id";
const LANGUAGE_PATTERN = /^[a-z0-9-]{2,35}$/;

function sessionFromRpc(value: unknown): TwoDeviceSession | null {
  if (!value || typeof value !== "object") return null;
  const result = value as SessionRpcResult;
  if (
    result.ok !== true ||
    typeof result.sessionId !== "string" ||
    typeof result.topic !== "string" ||
    typeof result.languageA !== "string" ||
    typeof result.languageB !== "string" ||
    typeof result.expiresAt !== "string" ||
    (result.role !== "host" && result.role !== "guest")
  ) {
    return null;
  }

  return {
    sessionId: result.sessionId,
    topic: result.topic,
    languageA: result.languageA,
    languageB: result.languageB,
    expiresAt: result.expiresAt,
    pairingExpiresAt:
      typeof result.pairingExpiresAt === "string" ? result.pairingExpiresAt : undefined,
    role: result.role,
  };
}

function safeRpcError(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const error = (value as { error?: unknown }).error;
  return typeof error === "string" && error ? error : fallback;
}

function normalizePairingCode(value: string) {
  return value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 16);
}

function getDeviceId() {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const created = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

function parseRemoteTurn(
  value: unknown,
  session: TwoDeviceSession,
): InterpreterBroadcastTurn | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<InterpreterBroadcastTurn>;
  if (
    typeof candidate.turnId !== "string" ||
    (candidate.speaker !== "A" && candidate.speaker !== "B") ||
    typeof candidate.sourceCode !== "string" ||
    typeof candidate.targetCode !== "string" ||
    typeof candidate.sourceText !== "string" ||
    typeof candidate.translatedText !== "string" ||
    typeof candidate.createdAt !== "string"
  ) {
    return null;
  }

  const expectedSource = candidate.speaker === "A" ? session.languageA : session.languageB;
  const expectedTarget = candidate.speaker === "A" ? session.languageB : session.languageA;
  if (
    candidate.sourceCode !== expectedSource ||
    candidate.targetCode !== expectedTarget ||
    !LANGUAGE_PATTERN.test(candidate.sourceCode) ||
    !LANGUAGE_PATTERN.test(candidate.targetCode) ||
    candidate.sourceText.length > 10_000 ||
    candidate.translatedText.length > 10_000 ||
    !candidate.sourceText.trim() ||
    !candidate.translatedText.trim()
  ) {
    return null;
  }

  return candidate as InterpreterBroadcastTurn;
}

function formatExpiry(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TwoDeviceInterpreterSession({
  languageA,
  languageB,
  broadcasterRef,
  onRemoteTurn,
  onSessionLanguages,
  onActiveChange,
  onPeerCountChange,
}: {
  languageA: string;
  languageB: string;
  broadcasterRef: MutableRefObject<InterpreterBroadcastFunction | null>;
  onRemoteTurn: (turn: InterpreterBroadcastTurn) => void;
  onSessionLanguages: (languageA: string, languageB: string) => void;
  onActiveChange: (active: boolean) => void;
  onPeerCountChange: (count: number) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sessionRef = useRef<TwoDeviceSession | null>(null);
  const [session, setSession] = useState<TwoDeviceSession | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [peerCount, setPeerCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(
    "Δημιούργησε προσωρινή ζεύξη ή βάλε τον κωδικό από την άλλη συσκευή.",
  );

  const disconnectChannel = useCallback(async () => {
    const channel = channelRef.current;
    channelRef.current = null;
    setPeerCount(0);
    if (channel) await supabase.removeChannel(channel);
  }, [supabase]);

  const connectSession = useCallback(
    async (nextSession: TwoDeviceSession) => {
      await disconnectChannel();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setAuthState("signed_out");
        setConnection("error");
        setNotice("Χρειάζεται σύνδεση για ιδιωτική ζεύξη δύο συσκευών.");
        return false;
      }

      setAuthState("ready");
      setConnection("connecting");
      supabase.realtime.setAuth(accessToken);
      const deviceId = getDeviceId();
      const channel = supabase.channel(nextSession.topic, {
        config: {
          private: true,
          broadcast: { ack: true, self: false },
          presence: { key: deviceId },
        },
      });
      channelRef.current = channel;

      channel
        .on("broadcast", { event: "interpreter_turn" }, ({ payload }) => {
          const currentSession = sessionRef.current;
          if (!currentSession) return;
          const turn = parseRemoteTurn(payload, currentSession);
          if (!turn) return;
          onRemoteTurn(turn);
        })
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const total = Object.values(state).reduce(
            (count, entries) => count + (Array.isArray(entries) ? entries.length : 0),
            0,
          );
          setPeerCount(Math.max(0, total - 1));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            setConnection("live");
            setNotice("✓ Ιδιωτικό realtime session ενεργό.");
            await channel.track({
              deviceId,
              role: nextSession.role,
              languageA: nextSession.languageA,
              languageB: nextSession.languageB,
              joinedAt: new Date().toISOString(),
            });
            return;
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setConnection("error");
            setNotice("Η ιδιωτική realtime σύνδεση δεν ολοκληρώθηκε.");
            return;
          }
          if (status === "CLOSED") setConnection("closed");
        });

      return true;
    },
    [disconnectChannel, onRemoteTurn, supabase],
  );

  const broadcastTurn = useCallback<InterpreterBroadcastFunction>(
    async (turn) => {
      const channel = channelRef.current;
      const activeSession = sessionRef.current;
      if (!channel || !activeSession || connection !== "live") return false;

      const parsed = parseRemoteTurn(turn, activeSession);
      if (!parsed) {
        setNotice("Η φράση δεν ταιριάζει στο κλειδωμένο language pair του session.");
        return false;
      }

      try {
        const result = await channel.send({
          type: "broadcast",
          event: "interpreter_turn",
          payload: parsed,
        });
        if (result !== "ok") {
          setNotice("Η τοπική μετάφραση ολοκληρώθηκε, αλλά η δεύτερη συσκευή δεν επιβεβαίωσε αποστολή.");
          return false;
        }
        return true;
      } catch {
        setNotice("Η τοπική μετάφραση ολοκληρώθηκε, αλλά το realtime broadcast απέτυχε.");
        return false;
      }
    },
    [connection],
  );

  useEffect(() => {
    broadcasterRef.current = broadcastTurn;
    return () => {
      broadcasterRef.current = null;
    };
  }, [broadcastTurn, broadcasterRef]);

  useEffect(() => {
    sessionRef.current = session;
    onActiveChange(Boolean(session));
  }, [session, onActiveChange]);

  useEffect(() => {
    onPeerCountChange(peerCount);
  }, [peerCount, onPeerCountChange]);

  useEffect(() => {
    let cancelled = false;

    async function resumeStoredSession() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const authSession = data.session;
      if (!authSession) {
        setAuthState("signed_out");
        return;
      }
      setAuthState("ready");

      const storedId = window.sessionStorage.getItem(STORED_SESSION_KEY);
      if (!storedId) return;

      const [sessionResult, memberResult] = await Promise.all([
        supabase
          .from("interpreter_sessions")
          .select("id,language_a,language_b,status,expires_at")
          .eq("id", storedId)
          .maybeSingle(),
        supabase
          .from("interpreter_session_members")
          .select("role")
          .eq("session_id", storedId)
          .eq("user_id", authSession.user.id)
          .is("left_at", null)
          .maybeSingle(),
      ]);
      if (cancelled) return;

      const row = sessionResult.data as PersistedSessionRow | null;
      const member = memberResult.data as MembershipRow | null;
      const role = member?.role === "guest" ? "guest" : member?.role === "host" ? "host" : null;
      const usable =
        row &&
        role &&
        (row.status === "pairing" || row.status === "active") &&
        new Date(row.expires_at).getTime() > Date.now();

      if (!usable || !row || !role) {
        window.sessionStorage.removeItem(STORED_SESSION_KEY);
        return;
      }

      const resumed: TwoDeviceSession = {
        sessionId: row.id,
        topic: `interpreter:${row.id}`,
        languageA: row.language_a,
        languageB: row.language_b,
        expiresAt: row.expires_at,
        role,
      };
      sessionRef.current = resumed;
      setSession(resumed);
      onSessionLanguages(resumed.languageA, resumed.languageB);
      setNotice(
        role === "host" && row.status === "pairing"
          ? "Το session επαναφέρθηκε. Ο pairing code δεν αποθηκεύεται· αν χάθηκε, κλείσε το session και δημιούργησε νέο."
          : "Επαναφέρω το ιδιωτικό two-device session…",
      );
      await connectSession(resumed);
    }

    void resumeStoredSession();
    return () => {
      cancelled = true;
      const channel = channelRef.current;
      channelRef.current = null;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [connectSession, onSessionLanguages, supabase]);

  async function requireAuth() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setAuthState("signed_out");
      setNotice("Χρειάζεται σύνδεση για να δημιουργήσεις ή να μπεις σε ιδιωτικό session.");
      return false;
    }
    setAuthState("ready");
    return true;
  }

  async function createSession() {
    if (busy || session) return;
    if (languageA === languageB) {
      setNotice("Επίλεξε δύο διαφορετικές γλώσσες πριν τη ζεύξη.");
      return;
    }
    if (!(await requireAuth())) return;

    setBusy(true);
    setNotice("Δημιουργώ προσωρινό ιδιωτικό session…");
    const { data, error } = await supabase.rpc("pantavion_create_interpreter_session", {
      p_language_a: languageA,
      p_language_b: languageB,
    });
    setBusy(false);
    if (error) {
      setNotice(error.message || "Δεν δημιουργήθηκε το session.");
      return;
    }

    const nextSession = sessionFromRpc(data);
    if (!nextSession) {
      setNotice(safeRpcError(data, "Το backend δεν επέστρεψε έγκυρο session."));
      return;
    }

    const rawResult = data as SessionRpcResult;
    setPairingCode(typeof rawResult.pairingCode === "string" ? rawResult.pairingCode : "");
    window.sessionStorage.setItem(STORED_SESSION_KEY, nextSession.sessionId);
    sessionRef.current = nextSession;
    setSession(nextSession);
    onSessionLanguages(nextSession.languageA, nextSession.languageB);
    await connectSession(nextSession);
  }

  async function joinSession() {
    if (busy || session) return;
    const code = normalizePairingCode(joinCode);
    if (code.length !== 16) {
      setNotice("Ο κωδικός ζεύξης πρέπει να έχει 16 δεκαεξαδικούς χαρακτήρες.");
      return;
    }
    if (!(await requireAuth())) return;

    setBusy(true);
    setNotice("Ελέγχω τον κωδικό και συνδέω τη δεύτερη συσκευή…");
    const { data, error } = await supabase.rpc("pantavion_join_interpreter_session", {
      p_pairing_code: code,
    });
    setBusy(false);
    if (error) {
      setNotice(error.message || "Η ζεύξη απέτυχε.");
      return;
    }

    const nextSession = sessionFromRpc(data);
    if (!nextSession) {
      const codeError = safeRpcError(data, "Ο κωδικός δεν είναι έγκυρος ή έχει λήξει.");
      const messages: Record<string, string> = {
        authentication_required: "Χρειάζεται σύνδεση.",
        pairing_rate_limited: "Πολλές προσπάθειες. Δοκίμασε ξανά αργότερα.",
        invalid_or_expired_pairing_code: "Ο κωδικός δεν είναι έγκυρος ή έχει λήξει.",
        pairing_session_full: "Το session έχει ήδη δεύτερο συμμετέχοντα.",
      };
      setNotice(messages[codeError] || codeError);
      return;
    }

    setJoinCode("");
    window.sessionStorage.setItem(STORED_SESSION_KEY, nextSession.sessionId);
    sessionRef.current = nextSession;
    setSession(nextSession);
    onSessionLanguages(nextSession.languageA, nextSession.languageB);
    await connectSession(nextSession);
  }

  async function leaveSession() {
    const active = sessionRef.current;
    if (!active || busy) return;
    setBusy(true);
    setNotice("Κλείνω το ιδιωτικό session…");
    const { data, error } = await supabase.rpc("pantavion_leave_interpreter_session", {
      p_session_id: active.sessionId,
    });
    if (error || !(data as { ok?: boolean } | null)?.ok) {
      setBusy(false);
      setNotice(error?.message || safeRpcError(data, "Το session δεν έκλεισε ακόμη."));
      return;
    }

    await disconnectChannel();
    window.sessionStorage.removeItem(STORED_SESSION_KEY);
    setPairingCode("");
    sessionRef.current = null;
    setSession(null);
    setConnection("closed");
    setBusy(false);
    setNotice("✓ Το ephemeral two-device session έκλεισε για όλους τους συμμετέχοντες.");
  }

  async function copyPairingCode() {
    if (!pairingCode) return;
    try {
      await navigator.clipboard.writeText(pairingCode);
      setNotice("✓ Ο κωδικός αντιγράφηκε. Ισχύει μόνο για αυτή τη ζεύξη.");
    } catch {
      setNotice("Δεν μπόρεσα να αντιγράψω αυτόματα τον κωδικό.");
    }
  }

  const connectionLabel =
    connection === "live"
      ? "LIVE"
      : connection === "connecting"
        ? "ΣΥΝΔΕΣΗ…"
        : connection === "error"
          ? "ERROR"
          : connection === "closed"
            ? "ΚΛΕΙΣΤΟ"
            : "OFF";

  return (
    <section className="mt-4 rounded-2xl border border-violet-200/20 bg-[#142f61] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
            ΔΥΟ ΣΥΣΚΕΥΕΣ · PRIVATE REALTIME
          </p>
          <h2 className="mt-1 text-lg font-black">Μίλα εδώ — άκου στη δεύτερη συσκευή.</h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-white/55">
            Ο ήχος δεν μεταδίδεται και δεν αποθηκεύεται. Μεταδίδεται μόνο η επιτυχημένη φράση και η μετάφρασή της μέσα σε προσωρινό ιδιωτικό session.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black ${
            connection === "live"
              ? "bg-emerald-300/15 text-emerald-100"
              : connection === "error"
                ? "bg-red-300/15 text-red-100"
                : "bg-white/10 text-white/65"
          }`}
        >
          {connectionLabel}
        </span>
      </div>

      {authState === "signed_out" ? (
        <div className="mt-3 rounded-xl border border-amber-200/25 bg-amber-200/10 p-3 text-xs font-bold text-amber-50">
          Για ζεύξη δύο συσκευών χρειάζεται λογαριασμός. Ο διερμηνέας μίας συσκευής παραμένει διαθέσιμος.
          <Link href="/auth/login" className="ml-2 underline underline-offset-2">
            Σύνδεση
          </Link>
        </div>
      ) : null}

      {!session ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-black text-cyan-100">1 · Πρώτη συσκευή</p>
            <p className="mt-1 text-xs text-white/55">Δημιούργησε pairing code 15 λεπτών. Το session λήγει αυτόματα σε 2 ώρες.</p>
            <button
              type="button"
              onClick={() => void createSession()}
              disabled={busy || authState === "checking"}
              className="mt-3 w-full rounded-full bg-cyan-300 px-4 py-2.5 text-xs font-black text-[#102a56] disabled:opacity-50"
            >
              {busy ? "…" : "Δημιουργία ζεύξης"}
            </button>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-black text-[#ffe29a]">2 · Δεύτερη συσκευή</p>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(normalizePairingCode(event.target.value))}
              placeholder="16-ψήφιος κωδικός"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="mt-2 w-full rounded-xl border border-white/15 bg-[#0f2b59] px-3 py-2.5 text-center font-mono text-sm font-black tracking-[0.12em] text-white outline-none"
            />
            <button
              type="button"
              onClick={() => void joinSession()}
              disabled={busy || joinCode.length !== 16 || authState === "checking"}
              className="mt-2 w-full rounded-full border border-[#f6c85f]/35 bg-[#f6c85f]/10 px-4 py-2.5 text-xs font-black text-[#ffe29a] disabled:opacity-40"
            >
              Σύνδεση με κωδικό
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-emerald-200/20 bg-emerald-200/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-emerald-100">
                {session.role === "host" ? "HOST" : "GUEST"} · {session.languageA.toUpperCase()} ↔ {session.languageB.toUpperCase()}
              </p>
              <p className="mt-1 text-[11px] text-white/50">
                Λήξη session: {formatExpiry(session.expiresAt)} · Άλλες ενεργές συσκευές: {peerCount}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void leaveSession()}
              disabled={busy}
              className="rounded-full border border-red-200/25 px-3 py-2 text-[11px] font-black text-red-100 disabled:opacity-40"
            >
              Κλείσιμο session
            </button>
          </div>

          {pairingCode ? (
            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-[#0f2b59] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-white/45">PAIRING CODE</p>
                <p className="mt-1 break-all font-mono text-lg font-black tracking-[0.12em] text-cyan-100">{pairingCode}</p>
                <p className="mt-1 text-[10px] text-white/40">Λήγει: {formatExpiry(session.pairingExpiresAt)} · δεν αποθηκεύεται σε plain text.</p>
              </div>
              <button
                type="button"
                onClick={() => void copyPairingCode()}
                className="rounded-full border border-cyan-200/25 px-4 py-2 text-xs font-black text-cyan-100"
              >
                Αντιγραφή
              </button>
            </div>
          ) : null}
        </div>
      )}

      <p className="mt-3 rounded-xl bg-black/10 px-3 py-2 text-[11px] font-semibold text-white/60">{notice}</p>
      <p className="mt-2 text-[10px] leading-4 text-white/35">
        Truth boundary: η ένδειξη LIVE σημαίνει ιδιωτικό Supabase Realtime channel για το συγκεκριμένο authenticated session. Δεν αποτελεί ακόμη απόδειξη end-to-end λειτουργίας σε δύο πραγματικές συσκευές μέχρι να γίνει live verification.
      </p>
    </section>
  );
}
