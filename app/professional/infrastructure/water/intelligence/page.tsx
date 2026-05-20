import Link from "next/link";
import {
  WATER_APPROVAL_INBOX,
  WATER_CHANGE_AND_EVIDENCE_LOG,
  WATER_ENGINEERING_INTELLIGENCE,
  WATER_FIELD_ASSISTANT,
  WATER_INTELLIGENCE_SIDEBAR,
  WATER_KERNEL_DOCTRINE,
  WATER_SEARCH_AND_GUIDANCE,
  WATER_SOURCE_VAULT,
  WATER_TECHNOLOGY_REGISTRY,
  WATER_VISIBILITY_RULES,
} from "@/core/water/water-intelligence-master-contract";

type PanelProps = {
  eyebrow: string;
  title: string;
  body: string;
  items: readonly string[];
  footer?: string;
  founderOnly?: boolean;
};

function Panel({ eyebrow, title, body, items, footer, founderOnly }: PanelProps) {
  return (
    <section className="rounded-3xl border border-[#f6c85f]/25 bg-[#071425]/88 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f6c85f]">
          {eyebrow}
        </p>
        {founderOnly ? (
          <span className="rounded-full border border-[#f6c85f]/35 bg-[#f6c85f]/10 px-3 py-1 text-xs font-black text-[#f8dfa0]">
            Founder only
          </span>
        ) : (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-100">
            Controlled
          </span>
        )}
      </div>

      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-200">{body}</p>

      <div className="mt-5 grid gap-2">
        {items.slice(0, 10).map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-slate-100"
          >
            {item}
          </div>
        ))}
      </div>

      {footer ? (
        <p className="mt-4 rounded-2xl border border-[#f6c85f]/20 bg-[#f6c85f]/10 px-4 py-3 text-sm font-black text-[#ffe29a]">
          {footer}
        </p>
      ) : null}
    </section>
  );
}

export default function WaterIntelligencePage() {
  const sidebarButtons = WATER_INTELLIGENCE_SIDEBAR.buttons;
  const approvalItems = WATER_APPROVAL_INBOX.includes;
  const sourceItems = WATER_SOURCE_VAULT.accepts;
  const fieldItems = WATER_FIELD_ASSISTANT.userCanSubmit;
  const changeItems = WATER_CHANGE_AND_EVIDENCE_LOG.entryTypes;
  const techItems = WATER_TECHNOLOGY_REGISTRY.technologies;
  const engineeringItems = WATER_ENGINEERING_INTELLIGENCE.modules;
  const searchItems = WATER_SEARCH_AND_GUIDANCE.searchRequirements;
  const founderHidden = WATER_VISIBILITY_RULES.hiddenFromUsers;

  return (
    <main className="min-h-screen bg-[#020b16] px-4 py-6 text-white sm:px-8 lg:px-12">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#f6c85f]/30 bg-[#09182b] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f6c85f]">
                Pantavion Water Intelligence
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl">
                Παράρτημα Ύδρευσης
              </h1>
              <p className="mt-4 max-w-4xl text-base font-semibold leading-8 text-slate-200">
                Ενιαίο κέντρο για αρχεία, βλάβες, φωτογραφίες, ηχητικές
                σημειώσεις, εγκρίσεις, τεχνολογίες, AI εισηγήσεις και στοιχεία
                περιοχής. Το υπάρχον live map δεν αγγίζεται.
              </p>
            </div>

            <div className="rounded-3xl border border-[#f6c85f]/25 bg-black/20 p-4 text-sm font-bold text-[#ffe29a]">
              <p>{WATER_KERNEL_DOCTRINE.name}</p>
              <p className="mt-2 text-xs leading-6 text-slate-300">
                {WATER_KERNEL_DOCTRINE.doctrine}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/professional/infrastructure/water"
              className="rounded-full border border-[#f6c85f]/50 bg-[#f6c85f]/15 px-5 py-3 text-sm font-black text-[#ffe29a]"
            >
              Είσοδος Ύδρευσης
            </Link>
            <Link
              href="/professional/infrastructure/water/live"
              className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100"
            >
              Live χάρτης
            </Link>
            <Link
              href="/professional/infrastructure/water/admin"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              Founder admin
            </Link>
          </div>
        </div>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#071425]/80 p-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f6c85f]">
            Quick appendix buttons
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sidebarButtons.map((button) => (
              <button
                key={button}
                type="button"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left text-sm font-black text-white"
              >
                {button}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
            Αυτά είναι τα κουμπιά του παραρτήματος. Στα επόμενα patches θα
            συνδεθούν με πραγματικές λίστες, φίλτρα, pending approvals και
            χάρτη.
          </p>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <Panel
            eyebrow="01 Source Vault"
            title="Αρχεία χάρτη και τεχνικές πηγές"
            body="Founder-only θησαυροφυλάκιο για μεγάλα ή ευαίσθητα αρχεία όπως DWG, DXF, KMZ, PDF, φωτογραφίες, scanner και telemetry exports. Δεν δημοσιεύονται raw στους χρήστες."
            items={sourceItems}
            footer="Τα master αρχεία μένουν κλειδωμένα και δεν αλλάζουν χωρίς δική σου ρητή έγκριση."
            founderOnly
          />

          <Panel
            eyebrow="02 Approval Inbox"
            title="Εγκρίσεις από εσένα"
            body="Μία ενιαία ουρά για νέους χρήστες, συσκευές, σημειώσεις, βλάβες, φωτογραφίες, ηχητικά, νέες οδούς, βάνες, αλλαγές και AI εισηγήσεις."
            items={approvalItems}
            footer="Καμία υποβολή χρήστη δεν γίνεται κοινή αυτόματα."
            founderOnly
          />

          <Panel
            eyebrow="03 Field Assistant"
            title="Εύκολη χρήση από εργάτη ή συνεργείο"
            body="Απλή ελεγχόμενη διεπαφή για ανθρώπους στο πεδίο. Μπορούν να προσθέτουν φωτογραφίες, σημειώσεις, ηχητικά, βλάβες και παρατηρήσεις χωρίς να βλέπουν εσωτερικά founder-only στοιχεία."
            items={fieldItems}
          />

          <Panel
            eyebrow="04 Change & Evidence Log"
            title="Ιστορικό αλλαγών και αποδείξεων"
            body="Μόνιμο αρχείο για νέα βάνα, αφαίρεση βάνας, επέκταση δικτύου, παροχές, βλάβες, βάθος, υλικό σωλήνα, φωτογραφίες, PDF και ηχητικές σημειώσεις."
            items={changeItems}
            footer="Κάθε αλλαγή περνά από pending σε founder review πριν γίνει approved shared layer."
            founderOnly
          />

          <Panel
            eyebrow="05 Technology Registry"
            title="Τεχνολογίες ύδρευσης"
            body="Μητρώο για τηλεμετρία, SCADA, RTU, αισθητήρες, δορυφορικά, GPR, drones, EPANET, 3D terrain, AI leak prediction και κάθε τεχνολογία που μπορεί να βοηθήσει."
            items={techItems}
            footer="Δεν απορρίπτουμε δύσκολη τεχνολογία. Την καταγράφουμε, τη βαθμολογούμε και τη συνδέουμε όταν γίνεται."
            founderOnly
          />

          <Panel
            eyebrow="06 Engineering AI"
            title="AI μηχανικής ύδρευσης"
            body="Founder-only intelligence για βλάβες, βάνες, δεξαμενές, ζώνες, πίεση, υψόμετρα, απομόνωση βλάβης, leak risk και ημερήσια αναφορά."
            items={engineeringItems}
            footer={WATER_ENGINEERING_INTELLIGENCE.valveOptimizationGoal}
            founderOnly
          />

          <Panel
            eyebrow="07 Search"
            title="Αναζήτηση και καθοδήγηση"
            body="Η αναζήτηση πρέπει να δέχεται Ελληνικά, Greeklish, English, λάθη, περιοχές, χωριά, ζώνες, οδούς και μη επίσημες νέες περιοχές."
            items={searchItems}
          />

          <Panel
            eyebrow="08 Hidden from users"
            title="Τι δεν βλέπουν οι χρήστες"
            body="Οι χρήστες βλέπουν μόνο εγκεκριμένα και ασφαλή στοιχεία. Τα raw sources, pending αλλαγές, AI risk και εσωτερικές εισηγήσεις μένουν μόνο σε εσένα."
            items={founderHidden}
            founderOnly
          />
        </section>
      </section>
    </main>
  );
}