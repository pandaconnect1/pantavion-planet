"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  WATER_DEPARTMENT_DATA_FLOWS,
  WATER_IMPLEMENTATION_SEQUENCE,
  WATER_KERNEL_DOCTRINE,
  WATER_OPERATION_ROLE_VIEWS,
  WATER_VISIBILITY_RULES,
} from "@/core/water/water-intelligence-master-contract";

const FOUNDER_CODE_STORAGE_KEY = "pantavion.water.admin.founderCode.v1";

function getSavedFounderCode() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(FOUNDER_CODE_STORAGE_KEY) || "";
}

function saveFounderCode(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOUNDER_CODE_STORAGE_KEY, value);
}

function forgetFounderCode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FOUNDER_CODE_STORAGE_KEY);
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#f6c85f]/25 bg-[#f6c85f]/10 px-3 py-1 text-xs font-black text-[#ffe29a]">
      {children}
    </span>
  );
}

function ListBlock({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-sm font-black text-[#f6c85f]">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold leading-6 text-slate-100"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleCard({
  role,
  purpose,
  sees,
  sendsTo,
}: {
  role: string;
  purpose: string;
  sees: readonly string[];
  sendsTo: readonly string[];
}) {
  return (
    <article className="rounded-[2rem] border border-[#f6c85f]/20 bg-[#071425] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f6c85f]">
          Ρόλος
        </p>
        <Chip>Ελεγχόμενη πρόσβαση</Chip>
      </div>

      <h2 className="mt-3 text-2xl font-black text-white">{role}</h2>
      <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">{purpose}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ListBlock title="Τι βλέπει" items={sees} />
        <ListBlock title="Πού προωθείται η πληροφορία" items={sendsTo} />
      </div>
    </article>
  );
}

function FlowCard({
  name,
  inputs,
  outputs,
}: {
  name: string;
  inputs: readonly string[];
  outputs: readonly string[];
}) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-[#071425]/90 p-5">
      <h3 className="text-xl font-black text-white">{name}</h3>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ListBlock title="Τι λαμβάνει" items={inputs} />
        <ListBlock title="Τι παράγει" items={outputs} />
      </div>
    </article>
  );
}

export default function WaterIntelligenceCommandClient() {
  const [founderCode, setFounderCode] = useState("");
  const [trusted, setTrusted] = useState(false);
  const [message, setMessage] = useState("Έλεγχος πρόσβασης...");
  const [loading, setLoading] = useState(false);

  async function validateFounder(codeValue: string) {
    const code = codeValue.trim();

    if (!code) {
      setTrusted(false);
      setMessage("Χρειάζεται κωδικός ιδρυτή/διαχειριστή.");
      return;
    }

    setLoading(true);
    setMessage("Έλεγχος κωδικού...");

    try {
      const response = await fetch(
        "/api/professional/infrastructure/water/access/admin/requests",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ founderCode: code }),
        },
      );

      const json = (await response.json()) as { ok?: boolean };

      if (!response.ok || !json.ok) {
        throw new Error("not_authorized");
      }

      saveFounderCode(code);
      setFounderCode(code);
      setTrusted(true);
      setMessage("Η πρόσβαση εγκρίθηκε για το Κέντρο Διοίκησης Ύδρευσης.");
    } catch {
      setTrusted(false);
      setMessage("Δεν εγκρίθηκε η πρόσβαση. Έλεγξε τον κωδικό.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = getSavedFounderCode();
    setFounderCode(saved);

    if (saved) {
      void validateFounder(saved);
      return;
    }

    setTrusted(false);
    setMessage("Η σελίδα αυτή είναι μόνο για ιδρυτή/διαχειριστή.");
  }, []);

  const sequence = useMemo(() => WATER_IMPLEMENTATION_SEQUENCE, []);

  if (!trusted) {
    return (
      <main className="min-h-screen bg-[#020b16] px-4 py-6 text-white sm:px-8">
        <section className="mx-auto flex min-h-[80vh] max-w-3xl items-center">
          <div className="w-full rounded-[2rem] border border-[#f6c85f]/30 bg-[#09182b] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f6c85f]">
              Κλειδωμένη ενότητα
            </p>
            <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              Κέντρο Διοίκησης Ύδρευσης
            </h1>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
              Αυτή η ενότητα είναι μόνο για ιδρυτή/διαχειριστή. Οι εργάτες,
              επιστάτες και απλοί χρήστες θα έχουν ξεχωριστές απλές οθόνες με
              όσα χρειάζονται.
            </p>

            <div className="mt-6 grid gap-3">
              <input
                value={founderCode}
                onChange={(event) => setFounderCode(event.target.value)}
                type="password"
                placeholder="Κωδικός ιδρυτή / διαχειριστή"
                className="rounded-2xl border border-[#f6c85f]/35 bg-black/25 px-4 py-4 text-white outline-none"
              />
              <button
                type="button"
                onClick={() => void validateFounder(founderCode)}
                disabled={loading}
                className="rounded-2xl bg-[#f6c85f] px-5 py-4 font-black text-black disabled:opacity-60"
              >
                Άνοιγμα κέντρου διοίκησης
              </button>
              <p className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-[#ffe29a]">
                {message}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/professional/infrastructure/water"
                className="rounded-full border border-[#f6c85f]/35 px-5 py-3 text-sm font-black text-[#ffe29a]"
              >
                Είσοδος ύδρευσης
              </Link>
              <Link
                href="/professional/infrastructure/water/live"
                className="rounded-full border border-emerald-400/30 px-5 py-3 text-sm font-black text-emerald-100"
              >
                Χάρτης
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020b16] px-4 py-6 text-white sm:px-8 lg:px-12">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#f6c85f]/30 bg-[#09182b] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f6c85f]">
                Pantavion Ύδρευση
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl">
                Κέντρο Διοίκησης Ύδρευσης
              </h1>
              <p className="mt-4 max-w-4xl text-base font-semibold leading-8 text-slate-200">
                Ενιαία εικόνα για εργάτες, επιστάτες, ιδρυτή, αποθήκη,
                λογιστήριο, HR, αποκοπές νερού, ατιμολόγητο νερό και διοίκηση
                οργανισμού. Ο ζωντανός χάρτης δεν επηρεάζεται.
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
              Είσοδος ύδρευσης
            </Link>
            <Link
              href="/professional/infrastructure/water/live"
              className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100"
            >
              Χάρτης
            </Link>
            <Link
              href="/professional/infrastructure/water/admin"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              Διαχείριση πρόσβασης
            </Link>
            <button
              type="button"
              onClick={() => {
                forgetFounderCode();
                setTrusted(false);
                setFounderCode("");
                setMessage("Η συσκευή βγήκε από το κέντρο διοίκησης.");
              }}
              className="rounded-full border border-red-400/35 bg-red-500/10 px-5 py-3 text-sm font-black text-red-100"
            >
              Έξοδος από διοίκηση
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <ListBlock
            title="Τι βλέπεις εσύ"
            items={WATER_VISIBILITY_RULES.founderCanSee}
          />
          <ListBlock
            title="Τι βλέπει εργάτης"
            items={WATER_VISIBILITY_RULES.workerCanSee}
          />
          <ListBlock
            title="Τι δεν βλέπουν οι χρήστες"
            items={WATER_VISIBILITY_RULES.hiddenFromUsers}
          />
        </section>

        <section className="mt-6">
          <div className="rounded-[2rem] border border-[#f6c85f]/25 bg-[#071425] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f6c85f]">
              Ρόλοι και οθόνες
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              Τι βλέπει κάθε τμήμα
            </h2>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-300">
              Ο εργάτης βλέπει απλά. Ο επιστάτης ελέγχει. Η αποθήκη και το
              λογιστήριο βλέπουν μόνο επιβεβαιωμένα στοιχεία. Το HR βλέπει
              χρόνους, επιφυλακές και ασφάλεια. Εσύ βλέπεις όλη την εικόνα.
            </p>
          </div>

          <div className="mt-5 grid gap-5">
            {WATER_OPERATION_ROLE_VIEWS.map((role) => (
              <RoleCard
                key={role.role}
                role={role.role}
                purpose={role.purpose}
                sees={role.sees}
                sendsTo={role.sendsTo}
              />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-[2rem] border border-[#f6c85f]/25 bg-[#071425] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f6c85f]">
              Ροή πληροφορίας
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              Από το πεδίο μέχρι διοίκηση, αποθήκη, λογιστήριο και HR
            </h2>
          </div>

          <div className="mt-5 grid gap-5">
            {WATER_DEPARTMENT_DATA_FLOWS.map((flow) => (
              <FlowCard
                key={flow.name}
                name={flow.name}
                inputs={flow.inputs}
                outputs={flow.outputs}
              />
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#071425] p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f6c85f]">
            Σειρά υλοποίησης
          </p>
          <div className="mt-5 grid gap-3">
            {sequence.map((item) => (
              <div
                key={item.phase}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
              >
                <p className="text-sm font-black text-[#ffe29a]">
                  {item.phase}. {item.name}
                </p>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">
                  {item.goal}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}