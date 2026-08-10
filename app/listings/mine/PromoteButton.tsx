"use client";

import { useState } from "react";

export default function PromoteButton({ listingId }: { listingId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function promote() {
    setStatus("loading");
    try {
      const response = await fetch(`/api/listings/${listingId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays: 7 }),
      });
      const result = await response.json();
      if (!response.ok || !result?.checkoutUrl) throw new Error("checkout unavailable");
      window.location.assign(result.checkoutUrl);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={promote}
        disabled={status === "loading"}
        className="rounded-xl border border-cyan-500/50 px-3 py-2 text-sm font-semibold text-cyan-200 disabled:opacity-50"
      >
        {status === "loading" ? "Opening checkout…" : "Promote for 7 days"}
      </button>
      {status === "error" && <span className="text-xs text-amber-300">Payment provider is not ready or checkout failed.</span>}
    </div>
  );
}
