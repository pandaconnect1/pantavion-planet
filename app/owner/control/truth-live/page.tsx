import { redirect } from "next/navigation";

import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProbeResult = {
  ok: boolean;
  httpStatus: number | null;
  checkedAt: string;
  response: unknown;
  error: string | null;
};

async function runProductionAgeProbe(): Promise<ProbeResult> {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch("https://www.pantavion.com/api/age-assurance/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        method: "CAMERA_LIVENESS",
        estimatedAge: 19,
        livenessPassed: false,
        jurisdiction: "CY",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = { parseError: "NON_JSON_RESPONSE" };
    }

    const verification = body as {
      ok?: unknown;
      verification?: { status?: unknown; ageBand?: unknown; assuranceLevel?: unknown };
      evidence?: { method?: unknown; jurisdiction?: unknown; rawImageStored?: unknown };
    };

    const passed =
      response.status === 422 &&
      verification.ok === false &&
      verification.verification?.status === "REJECTED" &&
      verification.verification?.ageBand === "UNKNOWN" &&
      verification.verification?.assuranceLevel === 0 &&
      verification.evidence?.method === "CAMERA_LIVENESS" &&
      verification.evidence?.jurisdiction === "CY" &&
      verification.evidence?.rawImageStored === false;

    return {
      ok: passed,
      httpStatus: response.status,
      checkedAt,
      response: body,
      error: passed ? null : "PRODUCTION_RESPONSE_DID_NOT_MATCH_REQUIRED_SAFETY_CONTRACT",
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: null,
      checkedAt,
      response: null,
      error: error instanceof Error ? error.message : "PRODUCTION_PROBE_FAILED",
    };
  }
}

function TruthBadge({ ok, good, bad }: { ok: boolean; good: string; bad: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${
        ok
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
          : "border-rose-500/50 bg-rose-500/10 text-rose-300"
      }`}
    >
      {ok ? good : bad}
    </span>
  );
}

export default async function FounderLiveTruthPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login?next=/owner/control/truth-live");

  try {
    requireFounderIdentity(auth.user.id);
  } catch {
    redirect("/");
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") {
    redirect("/owner/safety/verify?next=/owner/control/truth-live");
  }

  const probe = await runProductionAgeProbe();
  const deployment = {
    environment: process.env.VERCEL_ENV ?? "unknown",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown",
    url: process.env.VERCEL_URL ?? "unknown",
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Founder only · Live Truth
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-5xl">Τι λειτουργεί πραγματικά τώρα</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Αυτή η σελίδα δεν διαβάζει στατικό completion label. Κάνει πραγματικό server-side POST στο production API κάθε φορά που ανοίγει και δείχνει την απάντηση που επέστρεψε.
              </p>
            </div>
            <TruthBadge ok={probe.ok} good="PRODUCTION PROBE VERIFIED" bad="PRODUCTION PROBE FAILED" />
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">Runtime environment</div>
            <div className="mt-2 font-mono text-sm text-cyan-200">{deployment.environment}</div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">Deployed commit</div>
            <div className="mt-2 break-all font-mono text-xs text-cyan-200">{deployment.commit}</div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">Deployment host</div>
            <div className="mt-2 break-all font-mono text-xs text-cyan-200">{deployment.url}</div>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Age Assurance · Production API</div>
              <h2 className="mt-1 text-xl font-black">Failed-liveness safety probe</h2>
            </div>
            <TruthBadge ok={probe.ok} good="VERIFIED LIVE" bad="NOT VERIFIED" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-950/80 p-3">
              <div className="text-xs text-slate-500">HTTP</div>
              <div className="mt-1 font-mono text-sm">{probe.httpStatus ?? "NO RESPONSE"}</div>
            </div>
            <div className="rounded-xl bg-slate-950/80 p-3">
              <div className="text-xs text-slate-500">Checked at</div>
              <div className="mt-1 break-all font-mono text-xs">{probe.checkedAt}</div>
            </div>
            <div className="rounded-xl bg-slate-950/80 p-3">
              <div className="text-xs text-slate-500">Expected contract</div>
              <div className="mt-1 text-sm">422 + REJECTED + assurance 0</div>
            </div>
          </div>

          {probe.error ? (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {probe.error}
            </div>
          ) : null}

          <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4" open>
            <summary className="cursor-pointer text-sm font-bold text-slate-200">Πραγματικό production response</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">
              {JSON.stringify(probe.response, null, 2)}
            </pre>
          </details>
        </section>

        <section className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="text-xs font-black uppercase tracking-wider text-amber-300">Critical truth · όχι κρυμμένο</div>
          <h2 className="mt-2 text-xl font-black">External camera / age provider</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <TruthBadge ok={false} good="CONNECTED" bad="NOT CONNECTED" />
            <span className="text-sm text-slate-300">Yoti/Veriff/άλλος signed provider proof δεν έχει ακόμη συνδεθεί.</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Άρα το production endpoint και η πολιτική ανηλίκων μπορούν να ελεγχθούν live, αλλά δεν θεωρούμε πραγματική φωτογραφική επαλήθευση ηλικίας μέχρι το αποτέλεσμα να έρχεται από επαληθευμένο server-to-server provider receipt.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-black">Current truth matrix</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-950/70 p-3">
              <span>Production Age Assurance route</span><span className="font-black text-emerald-300">LIVE</span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-950/70 p-3">
              <span>Failed liveness blocks access</span><span className={probe.ok ? "font-black text-emerald-300" : "font-black text-rose-300"}>{probe.ok ? "VERIFIED LIVE" : "FAILED"}</span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-950/70 p-3">
              <span>Founder-only visibility + AAL2</span><span className="font-black text-emerald-300">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-950/70 p-3">
              <span>Real external camera/liveness provider</span><span className="font-black text-rose-300">NOT CONNECTED</span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-950/70 p-3">
              <span>Full minors system end-to-end</span><span className="font-black text-amber-300">NOT YET VERIFIED</span>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 pb-8">
          <a href="/owner/control" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-black text-slate-200">← Owner Control</a>
          <a href="/owner/control/implementation" className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-200">Implementation Truth</a>
        </div>
      </section>
    </main>
  );
}
