"use client";

import { useMemo, useState } from "react";

export type ModerationListing = {
  id: string;
  owner_id: string;
  listing_type: string;
  title: string;
  description: string | null;
  category: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  language_code: string | null;
  price_amount: number | null;
  price_currency: string | null;
  lifecycle_state: string;
  moderation_note: string | null;
  created_at: string;
};

type Props = {
  initialListings: ModerationListing[];
  role: string;
};

const actionLabels: Record<string, string> = {
  review: "Start review",
  approve: "Approve",
  reject: "Reject",
  publish: "Publish",
  remove: "Remove",
  expire: "Expire",
  archive: "Archive",
};

function actionsForState(state: string) {
  if (state === "submitted") return ["review", "approve", "reject"];
  if (state === "under_review") return ["approve", "reject", "remove"];
  if (state === "approved") return ["publish", "reject", "remove", "expire"];
  if (state === "published") return ["remove", "expire"];
  if (["removed", "expired", "rejected", "fulfilled", "sold", "rented"].includes(state)) return ["archive"];
  return [];
}

export default function ModerationClient({ initialListings, role }: Props) {
  const [listings, setListings] = useState(initialListings);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState("submitted");

  const visible = useMemo(
    () => listings.filter((item) => stateFilter === "all" || item.lifecycle_state === stateFilter),
    [listings, stateFilter],
  );

  async function moderate(listing: ModerationListing, action: string) {
    let reason: string | null = null;
    if (action === "reject" || action === "remove") {
      reason = window.prompt(`${actionLabels[action]} reason`);
      if (!reason?.trim()) return;
    }

    setBusyId(listing.id);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/moderation/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, action, reason }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "moderation_failed");

      const nextState = payload.transition?.next_state;
      if (nextState) {
        setListings((current) => current.map((item) => item.id === listing.id ? { ...item, lifecycle_state: nextState, moderation_note: reason } : item));
      }
      setMessage(`${listing.title}: ${actionLabels[action]} completed and audited.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Moderation failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div>
          <p className="text-sm text-slate-400">Authority</p>
          <p className="font-semibold text-white">{role}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          Queue
          <select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-white"
          >
            {['submitted','under_review','approved','published','rejected','removed','expired','archived','all'].map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </label>
      </div>

      {message ? <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">{message}</div> : null}

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-300">No listings in this queue.</div>
      ) : (
        <div className="grid gap-4">
          {visible.map((listing) => (
            <article key={listing.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <span>{listing.listing_type}</span><span>•</span><span>{listing.lifecycle_state}</span>
                    {listing.country_code ? <><span>•</span><span>{listing.country_code}</span></> : null}
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{listing.title}</h2>
                  {listing.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{listing.description}</p> : null}
                  <div className="mt-3 text-xs text-slate-500">Owner {listing.owner_id} · Submitted {new Date(listing.created_at).toLocaleString()}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actionsForState(listing.lifecycle_state).map((action) => (
                    <button
                      key={action}
                      disabled={busyId === listing.id}
                      onClick={() => moderate(listing, action)}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {busyId === listing.id ? "Working…" : actionLabels[action]}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
