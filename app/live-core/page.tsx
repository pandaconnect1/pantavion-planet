import Link from "next/link";
import {
  getPantavionLiveSummary,
  type PantavionLiveStatus,
} from "@/core/pantavion/live-backend-contract";

const badgeClass: Record<PantavionLiveStatus, string> = {
  operational: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  foundation: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  blocked: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  legal_review: "border-purple-400/40 bg-purple-400/10 text-purple-200",
  security_review: "border-red-400/40 bg-red-400/10 text-red-200",
};

export default function LiveCorePage() {
  const summary = getPantavionLiveSummary();

  return (
    <main className="min-h-screen bg-[#05070c] text-[#f6ead1]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12">
        <header className="rounded-[2rem] border border-[#d9a441]/25 bg-[#08111f]/90 p-8 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#d9a441]">
            Pantavion Live Core Spine
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight md:text-6xl">
            From static routes to truthful live operation.
          </h1>

          <p className="mt-5 max-w-4xl text-base leading-8 text-[#c9b99a] md:text-lg">
            This page is the operational truth gate. It shows what is live, what is foundation,
            what is blocked, and what must not be claimed publicly before real infrastructure exists.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-[#d9a441]/20 bg-black/25 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d9a441]">Version</p>
              <p className="mt-2 font-mono text-sm">{summary.version}</p>
            </div>

            <div className="rounded-2xl border border-[#d9a441]/20 bg-black/25 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d9a441]">Storage</p>
              <p className="mt-2 font-mono text-sm">{summary.storageMode}</p>
            </div>

            <div className="rounded-2xl border border-[#d9a441]/20 bg-black/25 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d9a441]">Persistence</p>
              <p className="mt-2 font-mono text-sm">
                {summary.persistentStorage ? "configured" : "blocked until database"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#d9a441]/20 bg-black/25 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d9a441]">Rule</p>
              <p className="mt-2 text-sm">No fake-live claims.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/api/health"
              className="rounded-full bg-[#d9a441] px-5 py-3 text-sm font-bold text-black"
            >
              Health API
            </Link>

            <Link
              href="/api/kernel/status"
              className="rounded-full border border-[#d9a441]/40 px-5 py-3 text-sm font-bold text-[#f6ead1]"
            >
              Kernel Status API
            </Link>

            <Link
              href="/api/pantai/execute"
              className="rounded-full border border-[#d9a441]/40 px-5 py-3 text-sm font-bold text-[#f6ead1]"
            >
              PantaAI Execute API
            </Link>

            <Link
              href="/deep-audit"
              className="rounded-full border border-[#d9a441]/40 px-5 py-3 text-sm font-bold text-[#f6ead1]"
            >
              Deep Audit
            </Link>
          </div>
        </header>

        <section className="grid gap-5">
          {summary.capabilities.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.5rem] border border-[#d9a441]/20 bg-[#09111d]/85 p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#d9a441]">
                    {item.surface}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">{item.name}</h2>
                </div>

                <span
                  className={`w-fit rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${badgeClass[item.status]}`}
                >
                  {item.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                    Allowed claim
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#d9ccb2]">
                    {item.allowedClaim}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-200">
                    Blocked claim
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#d9ccb2]">
                    {item.blockedClaim}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d9a441]">
                    Next action
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#d9ccb2]">
                    {item.nextAction}
                  </p>
                </div>
              </div>

              {item.requires.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.requires.map((need) => (
                    <span
                      key={need}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#cab98f]"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
