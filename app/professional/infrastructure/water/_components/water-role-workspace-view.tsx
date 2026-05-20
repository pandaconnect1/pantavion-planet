import Link from "next/link";
import {
  WATER_ADDRESS_SEARCH_UPGRADE_PLAN,
  WATER_MAP_CONTRIBUTION_RULES,
  WATER_ROLE_WORKSPACE_ORDER,
  WATER_ROLE_WORKSPACES,
  type WaterRoleWorkspaceId,
} from "@/core/water/water-role-workspace-registry";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#f6c85f]/20 bg-[#071425] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function List({ items }: { items: readonly string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold leading-6 text-slate-100"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

export function WaterRoleWorkspaceView({
  workspaceId,
}: {
  workspaceId: WaterRoleWorkspaceId;
}) {
  const workspace = WATER_ROLE_WORKSPACES[workspaceId];

  return (
    <main className="min-h-screen bg-[#020b16] px-4 py-6 text-white sm:px-8 lg:px-12">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#f6c85f]/30 bg-[#09182b] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f6c85f]">
            Pantavion Ύδρευση
          </p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight text-white sm:text-5xl">
            {workspace.title}
          </h1>
          <p className="mt-4 max-w-5xl text-base font-semibold leading-8 text-slate-200">
            {workspace.subtitle}
          </p>
          <p className="mt-4 rounded-2xl border border-[#f6c85f]/25 bg-[#f6c85f]/10 px-4 py-3 text-sm font-black leading-7 text-[#ffe29a]">
            {workspace.purpose}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/professional/infrastructure/water/workspaces"
              className="rounded-full border border-[#f6c85f]/50 bg-[#f6c85f]/15 px-5 py-3 text-sm font-black text-[#ffe29a]"
            >
              Όλοι οι ρόλοι
            </Link>
            <Link
              href="/professional/infrastructure/water/live"
              className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100"
            >
              Χάρτης
            </Link>
            <Link
              href="/professional/infrastructure/water/intelligence"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              Κέντρο ιδρυτή
            </Link>
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <Section title="Τι βλέπει">
            <List items={workspace.canSee} />
          </Section>

          <Section title="Τι μπορεί να καταχωρεί">
            <List items={workspace.canSubmit} />
          </Section>

          <Section title="Τι δεν βλέπει">
            <List items={workspace.cannotSee} />
          </Section>

          <Section title="Πού προωθείται η πληροφορία">
            <List items={workspace.sendsTo} />
          </Section>
        </section>

        <section className="mt-6">
          <Section title="Επόμενα λειτουργικά βήματα για αυτή την οθόνη">
            <List items={workspace.nextActions} />
          </Section>
        </section>

        {(workspaceId === "field" || workspaceId === "supervisor") ? (
          <section className="mt-6 grid gap-5 lg:grid-cols-2">
            <Section title="Βελτιωμένη αναζήτηση διεύθυνσης">
              <p className="mb-4 text-sm font-semibold leading-7 text-slate-300">
                {WATER_ADDRESS_SEARCH_UPGRADE_PLAN.purpose}
              </p>
              <List items={WATER_ADDRESS_SEARCH_UPGRADE_PLAN.accepts} />
            </Section>

            <Section title="Συμπλήρωση χάρτη χωρίς απώλεια δεδομένων">
              <p className="mb-4 text-sm font-semibold leading-7 text-slate-300">
                {WATER_MAP_CONTRIBUTION_RULES.safety}
              </p>
              <List items={WATER_MAP_CONTRIBUTION_RULES.userCanAdd} />
            </Section>
          </section>
        ) : null}
      </section>
    </main>
  );
}

export function WaterRoleWorkspaceOverview() {
  return (
    <main className="min-h-screen bg-[#020b16] px-4 py-6 text-white sm:px-8 lg:px-12">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#f6c85f]/30 bg-[#09182b] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f6c85f]">
            Pantavion Ύδρευση
          </p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight text-white sm:text-5xl">
            Ξεχωριστές οθόνες ανά ρόλο
          </h1>
          <p className="mt-4 max-w-5xl text-base font-semibold leading-8 text-slate-200">
            Κάθε ρόλος βλέπει μόνο αυτά που χρειάζεται. Ο εργάτης βλέπει απλά.
            Ο επιστάτης διοικεί βλάβες και συνεργεία. Ο αρχιεπιστάτης βλέπει
            συνολικά. Η αποθήκη, το λογιστήριο και το HR βλέπουν τα δικά τους.
            Ο ιδρυτής βλέπει τα πάντα.
          </p>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          {WATER_ROLE_WORKSPACE_ORDER.map((id) => {
            const workspace = WATER_ROLE_WORKSPACES[id];

            return (
              <Link
                key={workspace.id}
                href={workspace.route}
                className="rounded-[2rem] border border-[#f6c85f]/20 bg-[#071425] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] transition hover:border-[#f6c85f]/55"
              >
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f6c85f]">
                  {workspace.audience}
                </p>
                <h2 className="mt-3 text-2xl font-black text-white">
                  {workspace.title}
                </h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
                  {workspace.purpose}
                </p>
              </Link>
            );
          })}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <Section title="Αναζήτηση διεύθυνσης που πρέπει να φτιαχτεί">
            <List items={WATER_ADDRESS_SEARCH_UPGRADE_PLAN.requiredMapControls} />
          </Section>

          <Section title="Κύκλος ζωής προσθήκης στον χάρτη">
            <List items={WATER_MAP_CONTRIBUTION_RULES.lifecycle} />
          </Section>
        </section>
      </section>
    </main>
  );
}