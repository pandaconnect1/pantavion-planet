import {
  extremeSosDoctrine,
  sosCapabilityTruth,
} from "@/core/emergency/extreme-sos-capability";

export default function ExtremeOffgridPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-yellow-400/25 bg-gradient-to-br from-[#081229] via-[#07101f] to-black p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
          Extreme Off-grid SOS
        </p>

        <h1 className="mt-4 text-4xl font-bold md:text-6xl">
          {extremeSosDoctrine.title}
        </h1>

        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200">
          {extremeSosDoctrine.mission}
        </p>

        <div className="mt-6 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-yellow-50">
          <p className="text-2xl font-bold">{extremeSosDoctrine.operatingLaw}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-red-50">
          <p className="font-bold">Truth boundary</p>
          <p className="mt-2 text-sm leading-6">{extremeSosDoctrine.truthBoundary}</p>
        </div>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {sosCapabilityTruth.map((group) => (
            <article key={group.layer} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-bold text-yellow-200">{group.layer}</h2>
              <ul className="mt-4 space-y-2 text-slate-200">
                {group.items.map((item) => (
                  <li key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
