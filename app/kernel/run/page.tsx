import Link from "next/link";

export const metadata = {
  title: "Kernel Run | Pantavion One",
  description: "Stable Pantavion Kernel control room foundation.",
};

const layers = [
  "Prime Kernel",
  "Streaming Execution",
  "Continuity Mesh",
  "Capability Registry",
  "Security Spine",
  "Founder Signal Loop",
];

export default function KernelRunPage() {
  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="rounded-[2rem] border border-[#e8b94f]/25 bg-black/30 p-8 md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e8b94f]">
            Pantavion Kernel OS
          </p>

          <h1 className="mt-5 max-w-5xl text-5xl font-black leading-none md:text-7xl">
            Kernel control room is live.
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-200">
            This route is now stabilized as a server-rendered foundation page.
            The Kernel is the sovereign control layer for routing, resilience,
            recovery, security, execution, memory and future self-improvement
            orchestration across the Pantavion ecosystem.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {layers.map((layer) => (
              <div
                key={layer}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-xl font-black">{layer}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Foundation active. Live provider/database execution will be
                  connected only through governed, audited routes.
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-[#e8b94f] px-5 py-3 font-black text-black"
            >
              Back to Planet
            </Link>

            <Link
              href="/signals"
              className="rounded-full border border-cyan-400/50 px-5 py-3 font-black text-cyan-200"
            >
              Signal Map
            </Link>

            <Link
              href="/security"
              className="rounded-full border border-white/20 px-5 py-3 font-black text-white"
            >
              Security
            </Link>

            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-5 py-3 font-black text-white"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
