"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  WATER_FAULT_PRIORITY_LABELS,
  WATER_FAULT_PRIORITY_ORDER,
  WATER_FAULT_REGISTRY_DOCTRINE,
  WATER_FAULT_STATUS_LABELS,
  WATER_FAULT_TYPE_LABELS,
  type WaterFaultPriority,
  type WaterFaultRecord,
  type WaterFaultStatus,
  type WaterFaultType,
} from "@/core/water/water-fault-registry";

const STORAGE_KEY = "pantavion.water.fault.registry.v1";

const emptyFault = {
  reportedBy: "",
  area: "",
  street: "",
  number: "",
  postal: "",
  zone: "",
  faultType: "broken_pipe" as WaterFaultType,
  priority: "normal" as WaterFaultPriority,
  status: "new" as WaterFaultStatus,
  assignedCrew: "",
  affectedConsumers: "",
  waterCutoff: false,
  valveProblem: false,
  materials: "",
  notes: "",
  supervisorDecision: "",
};

function createId() {
  return `fault-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadFaults() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WaterFaultRecord[];
  } catch {
    return [];
  }
}

function saveFaults(records: WaterFaultRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-[#f6c85f]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none"
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-[110px] rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500"
    />
  );
}

function priorityClass(priority: WaterFaultPriority) {
  if (priority === "critical") return "border-red-400/40 bg-red-500/10 text-red-100";
  if (priority === "high") return "border-orange-400/40 bg-orange-500/10 text-orange-100";
  if (priority === "normal") return "border-sky-400/40 bg-sky-500/10 text-sky-100";
  return "border-white/20 bg-white/10 text-slate-100";
}

export default function WaterFaultRegistryClient() {
  const [faults, setFaults] = useState<WaterFaultRecord[]>([]);
  const [form, setForm] = useState(emptyFault);
  const [message, setMessage] = useState("Έτοιμο για καταχώρηση βλάβης.");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setFaults(loadFaults());
  }, []);

  function persist(next: WaterFaultRecord[]) {
    setFaults(next);
    saveFaults(next);
  }

  function submitFault(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.area.trim() && !form.street.trim()) {
      setMessage("ρειάζεται τουλάχιστον περιοχή ή οδός.");
      return;
    }

    const now = new Date().toISOString();
    const record: WaterFaultRecord = {
      id: createId(),
      createdAt: now,
      updatedAt: now,
      ...form,
    };

    const next = [record, ...faults];
    persist(next);
    setForm(emptyFault);
    setMessage(" βλάβη καταχωρήθηκε στο μητρώο της συσκευής και είναι έτοιμη για έλεγχο επιστάτη.");
  }

  function updateStatus(id: string, status: WaterFaultStatus) {
    const next = faults.map((fault) =>
      fault.id === id
        ? { ...fault, status, updatedAt: new Date().toISOString() }
        : fault,
    );

    persist(next);
  }

  function removeFault(id: string) {
    const ok = window.confirm("α αρχειοθετηθεί/διαγραφεί αυτή η τοπική καταχώρηση;");
    if (!ok) return;

    const next = faults.filter((fault) => fault.id !== id);
    persist(next);
  }

  const filteredFaults = useMemo(() => {
    const q = filter.trim().toLowerCase();

    return faults
      .filter((fault) => {
        if (!q) return true;
        return [
          fault.area,
          fault.street,
          fault.number,
          fault.zone,
          fault.assignedCrew,
          fault.notes,
          WATER_FAULT_TYPE_LABELS[fault.faultType],
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const byPriority =
          WATER_FAULT_PRIORITY_ORDER[a.priority] -
          WATER_FAULT_PRIORITY_ORDER[b.priority];

        if (byPriority !== 0) return byPriority;

        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [faults, filter]);

  const stats = useMemo(() => {
    return {
      total: faults.length,
      open: faults.filter((fault) => fault.status !== "completed" && fault.status !== "archived").length,
      critical: faults.filter((fault) => fault.priority === "critical").length,
      cutoff: faults.filter((fault) => fault.waterCutoff).length,
      valve: faults.filter((fault) => fault.valveProblem).length,
    };
  }, [faults]);

  return (
    <main className="min-h-screen bg-[#020b16] px-4 py-6 text-white sm:px-8 lg:px-12">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#f6c85f]/30 bg-[#09182b] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f6c85f]">
            Pantavion Ύδρευση
          </p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight text-white sm:text-5xl">
            ητρώο λαβών Ύδρευσης
          </h1>
          <p className="mt-4 max-w-5xl text-base font-semibold leading-8 text-slate-200">
            {WATER_FAULT_REGISTRY_DOCTRINE.purpose}
          </p>
          <p className="mt-4 rounded-2xl border border-[#f6c85f]/25 bg-[#f6c85f]/10 px-4 py-3 text-sm font-black leading-7 text-[#ffe29a]">
            {WATER_FAULT_REGISTRY_DOCTRINE.safety}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/professional/infrastructure/water/supervisor"
              className="rounded-full border border-[#f6c85f]/50 bg-[#f6c85f]/15 px-5 py-3 text-sm font-black text-[#ffe29a]"
            >
              θόνη επιστάτη
            </Link>
            <Link
              href="/professional/infrastructure/water/workspaces"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              όλοι
            </Link>
            <Link
              href="/professional/infrastructure/water/live"
              className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100"
            >
              άρτης
            </Link>
          </div>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-[#071425] p-4">
            <p className="text-xs font-black text-[#f6c85f]">Σύνολο</p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#071425] p-4">
            <p className="text-xs font-black text-[#f6c85f]">νοικτές</p>
            <p className="mt-2 text-3xl font-black">{stats.open}</p>
          </div>
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-4">
            <p className="text-xs font-black text-red-100">ρίσιμες</p>
            <p className="mt-2 text-3xl font-black">{stats.critical}</p>
          </div>
          <div className="rounded-3xl border border-sky-400/30 bg-sky-500/10 p-4">
            <p className="text-xs font-black text-sky-100">ποκοπές</p>
            <p className="mt-2 text-3xl font-black">{stats.cutoff}</p>
          </div>
          <div className="rounded-3xl border border-orange-400/30 bg-orange-500/10 p-4">
            <p className="text-xs font-black text-orange-100">άνες/ρεούλες</p>
            <p className="mt-2 text-3xl font-black">{stats.valve}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={submitFault}
            className="rounded-[2rem] border border-[#f6c85f]/20 bg-[#071425] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)]"
          >
            <h2 className="text-2xl font-black text-white">έα βλάβη</h2>
            <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">
              αταχώρησε γρήγορα τη βλάβη. ετά θα συνδεθεί με επιστάτη,
              συνεργείο, υλικά, αποθήκη, λογιστήριο και HR.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="οιος την ανέφερε">
                <Input
                  value={form.reportedBy}
                  onChange={(event) => setForm({ ...form, reportedBy: event.target.value })}
                  placeholder="π.χ. πολίτης, εργάτης, επιστάτης"
                />
              </Field>

              <Field label="εριοχή / χωριό">
                <Input
                  value={form.area}
                  onChange={(event) => setForm({ ...form, area: event.target.value })}
                  placeholder="π.χ. ερμασόγεια"
                />
              </Field>

              <Field label="δός">
                <Input
                  value={form.street}
                  onChange={(event) => setForm({ ...form, street: event.target.value })}
                  placeholder="π.χ. γίου εωργίου"
                />
              </Field>

              <Field label="ριθμός">
                <Input
                  value={form.number}
                  onChange={(event) => setForm({ ...form, number: event.target.value })}
                  placeholder="π.χ. 12"
                />
              </Field>

              <Field label="αχυδρομικός / ζώνη">
                <Input
                  value={form.postal}
                  onChange={(event) => setForm({ ...form, postal: event.target.value })}
                  placeholder="προαιρετικό"
                />
              </Field>

              <Field label="ώνη ύδρευσης">
                <Input
                  value={form.zone}
                  onChange={(event) => setForm({ ...form, zone: event.target.value })}
                  placeholder="π.χ. ώνη 12"
                />
              </Field>

              <Field label="ίδος βλάβης">
                <Select
                  value={form.faultType}
                  onChange={(event) =>
                    setForm({ ...form, faultType: event.target.value as WaterFaultType })
                  }
                >
                  {Object.entries(WATER_FAULT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="ροτεραιότητα">
                <Select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({ ...form, priority: event.target.value as WaterFaultPriority })
                  }
                >
                  {Object.entries(WATER_FAULT_PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="ατάσταση">
                <Select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as WaterFaultStatus })
                  }
                >
                  {Object.entries(WATER_FAULT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Συνεργείο">
                <Input
                  value={form.assignedCrew}
                  onChange={(event) => setForm({ ...form, assignedCrew: event.target.value })}
                  placeholder="π.χ. Συνεργείο 2"
                />
              </Field>

              <Field label="πηρεαζόμενοι καταναλωτές">
                <Input
                  value={form.affectedConsumers}
                  onChange={(event) =>
                    setForm({ ...form, affectedConsumers: event.target.value })
                  }
                  placeholder="π.χ. 20 σπίτια / άγνωστο"
                />
              </Field>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <label className="flex items-center gap-3 text-sm font-black text-white">
                  <input
                    type="checkbox"
                    checked={form.waterCutoff}
                    onChange={(event) => setForm({ ...form, waterCutoff: event.target.checked })}
                  />
                  πάρχει αποκοπή νερού
                </label>
                <label className="flex items-center gap-3 text-sm font-black text-white">
                  <input
                    type="checkbox"
                    checked={form.valveProblem}
                    onChange={(event) => setForm({ ...form, valveProblem: event.target.checked })}
                  />
                  πάρχει πρόβλημα σε βάνα / ρεούλα
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <Field label="λικά">
                <TextArea
                  value={form.materials}
                  onChange={(event) => setForm({ ...form, materials: event.target.value })}
                  placeholder="π.χ. σωλήνας 110, σύνδεσμος, βάνα, άμμος"
                />
              </Field>

              <Field label="Σημειώσεις">
                <TextArea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="εριγραφή βλάβης, σημείο, παρατηρήσεις πεδίου"
                />
              </Field>

              <Field label="πόφαση / οδηγία επιστάτη">
                <TextArea
                  value={form.supervisorDecision}
                  onChange={(event) =>
                    setForm({ ...form, supervisorDecision: event.target.value })
                  }
                  placeholder="π.χ. να πάει πρώτο το Συνεργείο 2, να ελεγχθεί η βάνα πάνω από την εκκλησία"
                />
              </Field>
            </div>

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-[#f6c85f] px-5 py-4 text-sm font-black text-black"
            >
              αταχώρηση βλάβης
            </button>

            <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold leading-7 text-[#ffe29a]">
              {message}
            </p>
          </form>

          <section className="rounded-[2rem] border border-[#f6c85f]/20 bg-[#071425] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">ίστα βλαβών</h2>
                <p className="mt-2 text-sm font-semibold text-slate-300">
                  α πιο επείγοντα εμφανίζονται πρώτα.
                </p>
              </div>
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="ναζήτηση βλάβης..."
              />
            </div>

            <div className="mt-5 grid gap-4">
              {filteredFaults.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm font-bold text-slate-300">
                  εν υπάρχουν καταχωρημένες βλάβες σε αυτή τη συσκευή.
                </div>
              ) : (
                filteredFaults.map((fault) => (
                  <article
                    key={fault.id}
                    className="rounded-3xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-black ${priorityClass(fault.priority)}`}>
                            {WATER_FAULT_PRIORITY_LABELS[fault.priority]}
                          </span>
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white">
                            {WATER_FAULT_STATUS_LABELS[fault.status]}
                          </span>
                          {fault.waterCutoff ? (
                            <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-xs font-black text-sky-100">
                              ποκοπή νερού
                            </span>
                          ) : null}
                          {fault.valveProblem ? (
                            <span className="rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-100">
                              άνα / ρεούλα
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-3 text-xl font-black text-white">
                          {WATER_FAULT_TYPE_LABELS[fault.faultType]}
                        </h3>
                        <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">
                          {[
                            fault.street,
                            fault.number,
                            fault.area,
                            fault.zone,
                            fault.postal,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "ωρίς πλήρη διεύθυνση"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Select
                          value={fault.status}
                          onChange={(event) =>
                            updateStatus(fault.id, event.target.value as WaterFaultStatus)
                          }
                        >
                          {Object.entries(WATER_FAULT_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                        <button
                          type="button"
                          onClick={() => removeFault(fault.id)}
                          className="rounded-2xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm font-black text-red-100"
                        >
                          φαίρεση
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm font-semibold leading-7 text-slate-300">
                      {fault.assignedCrew ? <p>Συνεργείο: {fault.assignedCrew}</p> : null}
                      {fault.affectedConsumers ? (
                        <p>πηρεαζόμενοι: {fault.affectedConsumers}</p>
                      ) : null}
                      {fault.materials ? <p>λικά: {fault.materials}</p> : null}
                      {fault.notes ? <p>Σημειώσεις: {fault.notes}</p> : null}
                      {fault.supervisorDecision ? (
                        <p className="rounded-2xl border border-[#f6c85f]/25 bg-[#f6c85f]/10 px-4 py-3 text-[#ffe29a]">
                          πόφαση επιστάτη: {fault.supervisorDecision}
                        </p>
                      ) : null}
                      <p className="text-xs text-slate-500">
                        ημιουργία: {new Date(fault.createdAt).toLocaleString("el-CY")}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#071425] p-5">
          <h2 className="text-2xl font-black text-white">πόμενη αναβάθμιση</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
            {WATER_FAULT_REGISTRY_DOCTRINE.nextDatabaseStep}
          </p>
        </section>
      </section>
    </main>
  );
}