import Link from "next/link";
import type { Metadata } from "next";
import {
  WATER_NETWORK_LAYER_PLAN,
  WATER_SECOND_NETWORK_SOURCE,
} from "@/core/water/water-second-network-source-registry";

export const metadata: Metadata = {
  title: "ηγές ικτύου Ύδρευσης | Pantavion",
  description:
    "Founder-only registry για το υπάρχον live δίκτυο και τη δεύτερη DWG πηγή στο Vercel Blob.",
};

function Text({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`water-source-text ${className}`}>{children}</span>;
}

function List({ items }: { items: readonly string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-bold leading-6 text-slate-100"
        >
          <Text>{item}</Text>
        </div>
      ))}
    </div>
  );
}

export default function WaterSourcesPage() {
  return (
    <main className="water-source-text-root min-h-screen bg-[#020b16] px-4 py-6 text-white sm:px-8 lg:px-12">
      <style>{`
        .water-source-text-root,
        .water-source-text-root * {
          font-family: Arial, "Segoe UI", "Noto Sans", sans-serif !important;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }

        .water-source-text-root *::first-letter {
          color: inherit !important;
          opacity: 1 !important;
          font-size: inherit !important;
          font-weight: inherit !important;
          margin: 0 !important;
          padding: 0 !important;
          text-transform: none !important;
          float: none !important;
        }

        .water-source-text {
          display: inline-block;
          padding-left: 0.35rem;
          margin-left: -0.15rem;
          overflow: visible !important;
          letter-spacing: 0 !important;
          text-indent: 0 !important;
          clip-path: none !important;
          mask-image: none !important;
          -webkit-mask-image: none !important;
        }
      `}</style>

      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#f6c85f]/30 bg-[#09182b] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f6c85f]">
            <Text>PANTAVION WATER SOURCE VAULT</Text>
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight text-white sm:text-5xl">
            <Text>ηγές δικτύου ύδρευσης</Text>
          </h1>

          <p className="mt-4 max-w-5xl text-base font-semibold leading-8 text-slate-200">
            <Text>
              ο δεύτερο DWG δίκτυο υπάρχει ως ανεβασμένη προστατευμένη πηγή στο Vercel Blob.
              εν είναι ακόμη ζωντανό επίπεδο χάρτη. ρώτα καταγράφεται, προστατεύεται,
              μετατρέπεται και συγκρίνεται.
            </Text>
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/professional/infrastructure/water/live"
              className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100"
            >
              <Text>ωντανός χάρτης</Text>
            </Link>
            <Link
              href="/professional/infrastructure/water/intelligence"
              className="rounded-full border border-[#f6c85f]/50 bg-[#f6c85f]/15 px-5 py-3 text-sm font-black text-[#ffe29a]"
            >
              <Text>έντρο ιδρυτή</Text>
            </Link>
            <Link
              href="/professional/infrastructure/water"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              <Text>ίσοδος ύδρευσης</Text>
            </Link>
          </div>
        </div>

        <section className="mt-6 rounded-[2rem] border border-[#f6c85f]/20 bg-[#071425] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f6c85f]">
            <Text> </Text>
          </p>

          <h2 className="mt-3 text-3xl font-black text-white">
            <Text>{WATER_SECOND_NETWORK_SOURCE.title}</Text>
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-xl font-black text-[#ffe29a]">
                <Text>τοιχεία αρχείου</Text>
              </h3>
              <div className="mt-4 grid gap-2 text-sm font-bold leading-7 text-slate-200">
                <p><Text>ρχείο: {WATER_SECOND_NETWORK_SOURCE.fileName}</Text></p>
                <p><Text>ποθηκευτικό σύστημα: {WATER_SECOND_NETWORK_SOURCE.storageLabel}</Text></p>
                <p><Text>Blob store: {WATER_SECOND_NETWORK_SOURCE.blobStore}</Text></p>
                <p><Text>έγεθος: {WATER_SECOND_NETWORK_SOURCE.approximateSize}</Text></p>
                <p><Text>ύπος: {WATER_SECOND_NETWORK_SOURCE.sourceType}</Text></p>
                <p><Text>ατάσταση: {WATER_SECOND_NETWORK_SOURCE.statusLabel}</Text></p>
                <p><Text>ρατότητα: {WATER_SECOND_NETWORK_SOURCE.visibilityLabel}</Text></p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-xl font-black text-[#ffe29a]">
                <Text>κοπός</Text>
              </h3>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
                <Text>{WATER_SECOND_NETWORK_SOURCE.purpose}</Text>
              </p>
              <p className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-black leading-7 text-red-100">
                <Text>{WATER_SECOND_NETWORK_SOURCE.notYet}</Text>
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-[#f6c85f]/20 bg-[#071425] p-5">
            <h2 className="text-2xl font-black text-white">
              <Text>πόμενα βήματα</Text>
            </h2>
            <div className="mt-5">
              <List items={WATER_SECOND_NETWORK_SOURCE.requiredNextSteps} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#f6c85f]/20 bg-[#071425] p-5">
            <h2 className="text-2xl font-black text-white">
              <Text>ανόνες προστασίας</Text>
            </h2>
            <div className="mt-5">
              <List items={WATER_SECOND_NETWORK_SOURCE.protectionRules} />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-[#f6c85f]/20 bg-[#071425] p-5">
          <h2 className="text-2xl font-black text-white">
            <Text>χέδιο επιπέδων χάρτη</Text>
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {WATER_NETWORK_LAYER_PLAN.map((item) => (
              <article
                key={item.layer}
                className="rounded-3xl border border-white/10 bg-black/20 p-5"
              >
                <h3 className="text-xl font-black text-[#ffe29a]">
                  <Text>{item.layer}</Text>
                </h3>
                <p className="mt-2 text-sm font-black text-slate-100">
                  <Text>{item.status}</Text>
                </p>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
                  <Text>{item.meaning}</Text>
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}