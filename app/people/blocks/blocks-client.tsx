"use client";

import { useState } from "react";

type Person = { id: string; display_name: string | null; username: string | null; country: string | null };

export default function BlocksClient({ people, initialBlocked }: { people: Person[]; initialBlocked: string[] }) {
  const [blocked, setBlocked] = useState(() => new Set(initialBlocked));
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function toggle(userId: string) {
    const isBlocked = blocked.has(userId);
    if (!isBlocked && !window.confirm("Να αποκλειστεί αυτός ο χρήστης;")) return;
    setBusy(userId);
    setNotice(null);
    const response = await fetch("/api/people/blocks", {
      method: isBlocked ? "DELETE" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blockedId: userId }),
    });
    const json = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) {
      setNotice(json.detail || json.error || "Η αλλαγή αποκλεισμού απέτυχε.");
      return;
    }
    setBlocked((current) => {
      const next = new Set(current);
      if (isBlocked) next.delete(userId); else next.add(userId);
      return next;
    });
    setNotice(isBlocked ? "Ο αποκλεισμός αφαιρέθηκε." : "Ο χρήστης αποκλείστηκε.");
  }

  return (
    <div className="space-y-4">
      {notice ? <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">{notice}</div> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => {
          const isBlocked = blocked.has(person.id);
          return (
            <article key={person.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-black text-slate-900">{person.display_name || person.username || "Pantavion User"}</p>
              <p className="mt-1 text-xs text-slate-500">{person.country || "Pantavion"}</p>
              <button disabled={busy === person.id} onClick={() => toggle(person.id)} className="mt-4 w-full rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 disabled:opacity-40">
                {busy === person.id ? "..." : isBlocked ? "Άρση αποκλεισμού" : "Αποκλεισμός"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
