"use client";

import { useEffect, useState } from "react";

type RuntimeState = {
  authenticated: boolean;
  pending: number | null;
  approved: number | null;
  blocked: number | null;
  status: "loading" | "ready" | "error";
  message: string;
};

export default function FounderControlRuntime() {
  const [state, setState] = useState<RuntimeState>({
    authenticated: false,
    pending: null,
    approved: null,
    blocked: null,
    status: "loading",
    message: "Έλεγχος Founder/Admin session και Water access…",
  });

  async function refresh() {
    setState((current) => ({
      ...current,
      status: "loading",
      message: "Ανανέωση live κατάστασης…",
    }));

    try {
      const sessionResponse = await fetch(
        "/api/professional/infrastructure/water/admin/session",
        { method: "GET", credentials: "include", cache: "no-store" },
      );

      const sessionJson = (await sessionResponse.json()) as {
        authenticated?: boolean;
      };

      if (!sessionResponse.ok || !sessionJson.authenticated) {
        setState({
          authenticated: false,
          pending: null,
          approved: null,
          blocked: null,
          status: "error",
          message: "Δεν υπάρχει ενεργό Founder/Admin session.",
        });
        return;
      }

      const [requestsResponse, approvedResponse] = await Promise.all([
        fetch("/api/professional/infrastructure/water/access/admin/requests", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        }),
        fetch("/api/professional/infrastructure/water/access/admin/approved", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        }),
      ]);

      const requestsJson = (await requestsResponse.json()) as {
        ok?: boolean;
        requests?: unknown[];
      };
      const approvedJson = (await approvedResponse.json()) as {
        ok?: boolean;
        approvedUsers?: unknown[];
        blockedUsers?: unknown[];
      };

      if (
        !requestsResponse.ok ||
        !requestsJson.ok ||
        !approvedResponse.ok ||
        !approvedJson.ok
      ) {
        throw new Error("admin_runtime_data_unavailable");
      }

      setState({
        authenticated: true,
        pending: requestsJson.requests?.length ?? 0,
        approved: approvedJson.approvedUsers?.length ?? 0,
        blocked: approvedJson.blockedUsers?.length ?? 0,
        status: "ready",
        message: "Founder/Admin session ενεργό. Τα live access δεδομένα φορτώθηκαν.",
      });
    } catch {
      setState({
        authenticated: true,
        pending: null,
        approved: null,
        blocked: null,
        status: "error",
        message: "Το session είναι ενεργό, αλλά κάποιο live admin endpoint δεν απάντησε σωστά.",
      });
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section className="mt-6 rounded-3xl border border-slate-700 bg-[#0d1a2d] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Live Founder Oversight
          </p>
          <h2 className="mt-2 text-2xl font-black">Access / Users / Devices</h2>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={state.status === "loading"}
          className="rounded-2xl border border-[#f2c766]/50 px-4 py-2 font-black text-[#f2c766] disabled:opacity-50"
        >
          {state.status === "loading" ? "Έλεγχος…" : "Ανανέωση"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-[#07111f] p-4">
          <p className="text-xs text-slate-400">Founder/Admin session</p>
          <p className="mt-2 text-2xl font-black">
            {state.authenticated ? "ACTIVE" : "NOT ACTIVE"}
          </p>
        </article>
        <article className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-4">
          <p className="text-xs text-amber-100/70">Pending access</p>
          <p className="mt-2 text-3xl font-black text-amber-100">
            {state.pending ?? "—"}
          </p>
        </article>
        <article className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-4">
          <p className="text-xs text-emerald-100/70">Approved users/devices</p>
          <p className="mt-2 text-3xl font-black text-emerald-100">
            {state.approved ?? "—"}
          </p>
        </article>
        <article className="rounded-2xl border border-red-500/30 bg-red-950/15 p-4">
          <p className="text-xs text-red-100/70">Blocked devices</p>
          <p className="mt-2 text-3xl font-black text-red-100">
            {state.blocked ?? "—"}
          </p>
        </article>
      </div>

      <p
        className={`mt-4 rounded-2xl border p-3 text-sm font-bold ${
          state.status === "error"
            ? "border-red-500/40 bg-red-950/20 text-red-100"
            : "border-emerald-500/30 bg-emerald-950/15 text-emerald-100"
        }`}
      >
        {state.message}
      </p>
    </section>
  );
}
