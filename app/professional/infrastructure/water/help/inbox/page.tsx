"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DEVICE_ID_KEY = "pantavion.water.help.deviceId.v1";
const DEVICE_TOKEN_KEY = "pantavion.water.help.deviceToken.v1";

type HelpInboxItem = {
  id: string;
  category: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  requestedBy: string;
  role: string;
  contact: string;
  areaLabel: string;
  roadLabel: string;
  zoneLabel: string;
  targetDepartment: string;
  suggestedAssignee: string;
  aiFirstRecommendation: string;
  createdAt: string;
  routing: {
    deliveryStatus: string;
    deliveryTargetLabel: string;
    requiresManualForwarding: boolean;
    fallbackReason: string;
  };
};

type InboxResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  count?: number;
  items?: HelpInboxItem[];
};

function label(value: string) {
  return value || "—";
}

function dateLabel(value: string) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("el-CY", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function WaterUserHelpInboxPage() {
  const [items, setItems] = useState<HelpInboxItem[]>([]);
  const [message, setMessage] = useState("Φόρτωση δικών μου αιτημάτων από αυτή τη συσκευή...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadRequesterInbox();
  }, []);

  async function loadRequesterInbox() {
    if (typeof window === "undefined") return;

    const deviceId = window.localStorage.getItem(DEVICE_ID_KEY) || "";
    const deviceToken = window.localStorage.getItem(DEVICE_TOKEN_KEY) || "";

    if (!deviceToken) {
      setItems([]);
      setMessage("Δεν υπάρχει ακόμη αίτημα από αυτή τη συσκευή. Στείλε πρώτα ένα αίτημα.");
      return;
    }

    setLoading(true);
    setMessage("Φόρτωση δικών μου αιτημάτων...");

    try {
      const params = new URLSearchParams({
        scope: "requester",
        deviceId,
      });

      const response = await fetch(`/api/professional/infrastructure/water/help/inbox?${params.toString()}`, {
        headers: {
          "x-pantavion-device-token": deviceToken,
        },
        cache: "no-store",
      });

      const json = (await response.json()) as InboxResponse;

      if (!response.ok || !json.ok) {
        throw new Error(json.message || json.error || "requester_inbox_failed");
      }

      setItems(json.items || []);
      setMessage(`Βρέθηκαν ${json.count || 0} δικά σου αιτήματα από αυτή τη συσκευή.`);
    } catch (error) {
      setItems([]);
      setMessage(error instanceof Error ? error.message : "Δεν φορτώθηκε το inbox.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <Link href="/professional/infrastructure/water/help" className="text-sm font-black text-[#f2c766]">
          ← Πίσω στα αιτήματα
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION WATER MY HELP INBOX
        </p>

        <h1 className="mt-3 text-3xl font-black">Τα δικά μου αιτήματα</h1>

        <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
          Εδώ φαίνονται τα αιτήματα που στάλθηκαν από αυτή τη συσκευή. Δεν υπάρχει ορατό token.
          Όταν μπει πλήρες Pantavion login, εδώ θα φαίνονται και όσα έχουν ανατεθεί πραγματικά στον χρήστη.
        </p>

        <button
          type="button"
          onClick={() => void loadRequesterInbox()}
          disabled={loading}
          className="mt-5 rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
        >
          Φόρτωση δικών μου αιτημάτων
        </button>

        <p className="mt-4 rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm font-black text-[#f2c766]">
          {message}
        </p>

        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-700 bg-[#07111f] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2c766]">
                {label(item.id)}
              </p>
              <h2 className="mt-2 text-2xl font-black">{label(item.title)}</h2>
              <p className="mt-2 text-sm font-bold text-slate-300">{label(item.description)}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Info title="Ημερομηνία" value={dateLabel(item.createdAt)} />
                <Info title="Κατάσταση" value={label(item.routing.deliveryStatus || item.status)} />
                <Info title="Προορισμός" value={label(item.routing.deliveryTargetLabel)} />
                <Info title="Κατηγορία" value={label(item.category)} />
                <Info title="Προτεραιότητα" value={label(item.priority)} />
                <Info title="Από" value={`${label(item.requestedBy)} / ${label(item.role)}`} />
                <Info title="Περιοχή" value={label(item.areaLabel)} />
                <Info title="Οδός" value={label(item.roadLabel)} />
                <Info title="Ζώνη" value={label(item.zoneLabel)} />
              </div>

              {item.aiFirstRecommendation ? (
                <p className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-950/20 p-4 text-sm font-black text-emerald-100">
                  AI πρώτη εισήγηση: {item.aiFirstRecommendation}
                </p>
              ) : null}
            </article>
          ))}

          {!items.length ? (
            <p className="rounded-2xl border border-slate-700 bg-[#07111f] p-5 text-sm font-bold text-slate-300">
              Δεν υπάρχουν αιτήματα σε αυτή την προβολή.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-[#0d1a2d] p-3">
      <p className="text-xs font-black text-[#f2c766]">{title}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
