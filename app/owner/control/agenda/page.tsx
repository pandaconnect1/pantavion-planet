import { redirect } from "next/navigation";

import {
  listPantavionFounderCanonicalStates,
  listPantavionFounderExecutionIntents,
} from "@/core/kernel/pantavion-founder-canonical-state-runtime";
import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import { createClient } from "@/lib/supabase/server";

import FounderAgendaClient from "./agenda-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusClass: Record<string, string> = {
  pending_materialization: "text-amber-300",
  materializing: "text-cyan-300",
  materialized: "text-emerald-300",
  blocked: "text-rose-300",
  cancelled: "text-slate-400",
};

export default async function FounderAgendaPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login?next=/owner/control/agenda");

  try {
    requireFounderIdentity(auth.user.id);
  } catch {
    redirect("/");
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") {
    redirect("/owner/safety/verify?next=/owner/control/agenda");
  }

  const [states, intents] = await Promise.all([
    listPantavionFounderCanonicalStates(25),
    listPantavionFounderExecutionIntents(250),
  ]);

  const agendaIntents = intents.filter(
    (item) =>
      item.idempotencyKey.startsWith("agenda:") ||
      states.some(
        (state) =>
          state.stateId === item.canonicalStateId &&
          state.stateKind.startsWith("agenda_directive:"),
      ),
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-violet-500/25 bg-slate-900/85 p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-300">
            Pantavion Founder Agenda
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
            Εντολές · Κατάσταση · Εκτέλεση
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            Κάθε εντολή που καταχωρείς εδώ αποθηκεύεται ως canonical founder
            directive, παίρνει immutable fingerprint και συνδέεται με το durable
            execution pipeline. Η κατάσταση εμφανίζεται χωρίς να βαφτίζεται κάτι
            ολοκληρωμένο πριν υπάρξει πραγματικό execution evidence.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/owner/control"
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-black text-slate-200"
            >
              ← Owner Control
            </a>
            <a
              href="/owner/control/implementation"
              className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-100"
            >
              Implementation Truth
            </a>
            <a
              href="/owner/control/truth-live"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-100"
            >
              Live Truth
            </a>
          </div>
        </div>

        <FounderAgendaClient />

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                Durable directives
              </p>
              <h2 className="mt-2 text-2xl font-black">Τι έχει δοθεί και πού βρίσκεται</h2>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
              {agendaIntents.length} agenda items
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {agendaIntents.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
                Δεν υπάρχουν ακόμη canonical agenda directives.
              </div>
            ) : (
              agendaIntents
                .slice()
                .reverse()
                .map((item) => (
                  <article
                    key={item.intentId}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-white">{item.title}</h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                          {item.founderIntent}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border border-slate-700 px-3 py-1 text-xs font-black ${statusClass[item.status] ?? "text-slate-300"}`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
                      <div>Target: <span className="text-slate-200">{item.target}</span></div>
                      <div>Scope: <span className="text-slate-200">{item.approvalScope}</span></div>
                      <div>Updated: <span className="text-slate-200">{item.updatedAt}</span></div>
                      <div>
                        Execution: <span className="text-slate-200">{item.workOrderExecutionId || "—"}</span>
                      </div>
                    </div>

                    {item.lastError ? (
                      <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                        Blocker: {item.lastError}
                      </div>
                    ) : null}
                  </article>
                ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
