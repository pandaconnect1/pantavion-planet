"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  createFounderIntentRecord,
  decryptFounderIntentVault,
  encryptFounderIntentVault,
  founderIntentModules,
  type EncryptedFounderIntentVault,
  type FounderIntentInput,
  type FounderIntentModule,
  type FounderIntentPriority,
  type FounderIntentRecord,
} from "@/core/intent/pantavion-founder-intent-workbench";

const storageKey = "pantavion:founder-intent-workbench:v1";

const emptyInput: FounderIntentInput = {
  title: "",
  desiredOutcome: "",
  acceptanceEvidence: "",
  module: "intent_to_outcome",
  priority: "normal",
  maxActions: 8,
  maxMinutes: 120,
};

const moduleLabels: Record<FounderIntentModule, string> = {
  intent_to_outcome: "Intent-to-Outcome Fabric",
  ephemeral_agent_swarm: "Ephemeral Agent Swarm",
  disconnected_edge: "Disconnected / Edge",
  intent_firewall: "Intent Firewall",
  capability_budget: "Capability & Budget",
  owner_control: "Owner Control",
  technology_library: "Technology Library",
  implementation_truth: "Implementation Truth",
};

export default function IntentWorkbenchClient() {
  const [input, setInput] = useState<FounderIntentInput>(emptyInput);
  const [records, setRecords] = useState<FounderIntentRecord[]>([]);
  const [vaultPassphrase, setVaultPassphrase] = useState("");
  const [vaultPresent, setVaultPresent] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVaultPresent(Boolean(localStorage.getItem(storageKey)));
  }, []);

  const activeRecords = useMemo(() => records.filter((record) => record.state === "captured"), [records]);

  function update<K extends keyof FounderIntentInput>(key: K, value: FounderIntentInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  async function persist(next: FounderIntentRecord[]) {
    const vault = await encryptFounderIntentVault(next, vaultPassphrase);
    localStorage.setItem(storageKey, JSON.stringify(vault));
    setVaultPresent(true);
  }

  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (vaultPassphrase.length < 12) throw new Error("vault_passphrase_invalid");
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const vault = JSON.parse(stored) as EncryptedFounderIntentVault;
        setRecords(await decryptFounderIntentVault(vault, vaultPassphrase));
      }
      setUnlocked(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "intent_vault_unlock_failed");
    } finally {
      setBusy(false);
    }
  }

  async function capture(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const record = await createFounderIntentRecord({
        input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      const next = [record, ...records];
      await persist(next);
      setRecords(next);
      setInput(emptyInput);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "intent_capture_failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeFromDevice(id: string) {
    setBusy(true);
    setError(null);
    const next = records.filter((record) => record.id !== id);
    try {
      await persist(next);
      setRecords(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "intent_delete_failed");
    } finally {
      setBusy(false);
    }
  }

  async function exportEvidence() {
    if (!records.length) return;
    await persist(records);
    const payload = localStorage.getItem(storageKey);
    if (!payload) throw new Error("intent_vault_missing");
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pantavion-founder-intents-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importEvidence(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const vault = JSON.parse(await file.text()) as EncryptedFounderIntentVault;
      const imported = await decryptFounderIntentVault(vault, vaultPassphrase);
      const byId = new Map([...records, ...imported].map((record) => [record.id, record]));
      const next = [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      await persist(next);
      setRecords(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "intent_import_failed");
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <form onSubmit={unlock} className="mx-auto mt-6 max-w-xl space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">AES-GCM-256 encrypted vault</p>
          <h2 className="mt-2 text-2xl font-black text-white">{vaultPresent ? "Ξεκλείδωμα Intent Vault" : "Δημιουργία Intent Vault"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Η φράση ασφαλείας δεν αποθηκεύεται ούτε αποστέλλεται. Αν χαθεί, το Pantavion δεν μπορεί να ανακτήσει τις τοπικές εγγραφές.
          </p>
        </div>
        <label className="block text-sm font-bold text-slate-200">
          Φράση ασφαλείας · τουλάχιστον 12 χαρακτήρες
          <input
            type="password"
            required
            minLength={12}
            maxLength={256}
            autoComplete="current-password"
            value={vaultPassphrase}
            onChange={(event) => setVaultPassphrase(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-slate-100"
          />
        </label>
        {error ? <p className="rounded-xl border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{error}</p> : null}
        <button disabled={busy} className="min-h-12 w-full rounded-xl bg-cyan-400 px-4 font-black text-slate-950 disabled:opacity-50">
          {busy ? "Επαλήθευση..." : vaultPresent ? "ΞΕΚΛΕΙΔΩΜΑ" : "ΔΗΜΙΟΥΡΓΙΑ ΤΟΠΙΚΟΥ VAULT"}
        </button>
      </form>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form onSubmit={capture} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Create real local intent</p>
          <h2 className="mt-2 text-xl font-black text-white">Νέα εντολή Founder</h2>
        </div>

        <label className="block text-sm font-bold text-slate-200">
          Τίτλος
          <input
            required
            maxLength={180}
            value={input.title}
            onChange={(event) => update("title", event.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-slate-100"
          />
        </label>

        <label className="block text-sm font-bold text-slate-200">
          Επιθυμητό πραγματικό αποτέλεσμα
          <textarea
            required
            maxLength={4000}
            rows={5}
            value={input.desiredOutcome}
            onChange={(event) => update("desiredOutcome", event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-100"
          />
        </label>

        <label className="block text-sm font-bold text-slate-200">
          Απόδειξη αποδοχής / verify
          <textarea
            required
            maxLength={2000}
            rows={4}
            value={input.acceptanceEvidence}
            onChange={(event) => update("acceptanceEvidence", event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-100"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-200">
            Ενότητα
            <select
              value={input.module}
              onChange={(event) => update("module", event.target.value as FounderIntentModule)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3"
            >
              {founderIntentModules.map((module) => <option key={module} value={module}>{moduleLabels[module]}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200">
            Προτεραιότητα
            <select
              value={input.priority}
              onChange={(event) => update("priority", event.target.value as FounderIntentPriority)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200">
            Μέγιστες ενέργειες
            <input
              type="number"
              min={1}
              max={50}
              value={input.maxActions}
              onChange={(event) => update("maxActions", Number(event.target.value))}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3"
            />
          </label>
          <label className="text-sm font-bold text-slate-200">
            Μέγιστα λεπτά
            <input
              type="number"
              min={1}
              max={1440}
              value={input.maxMinutes}
              onChange={(event) => update("maxMinutes", Number(event.target.value))}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3"
            />
          </label>
        </div>

        {error ? <p className="rounded-xl border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{error}</p> : null}

        <button disabled={busy} className="min-h-12 w-full rounded-xl bg-cyan-400 px-4 font-black text-slate-950 disabled:opacity-50">
          {busy ? "Επαλήθευση..." : "ΑΠΟΘΗΚΕΥΣΗ OFFLINE ΜΕ SHA-256"}
        </button>
      </form>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">Τοπικές πραγματικές εγγραφές</div>
            <div className="mt-1 text-2xl font-black text-white">{activeRecords.length}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void exportEvidence()} disabled={!records.length || busy} className="min-h-11 rounded-xl border border-cyan-500/50 px-4 text-sm font-black text-cyan-200 disabled:opacity-40">Encrypted export</button>
            <button type="button" onClick={() => importRef.current?.click()} className="min-h-11 rounded-xl border border-slate-600 px-4 text-sm font-black text-slate-200">Import + verify</button>
            <input ref={importRef} type="file" accept="application/json,.json" onChange={importEvidence} className="hidden" />
          </div>
        </div>

        {activeRecords.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
            Δεν υπάρχει ακόμη τοπική εντολή. Η πρώτη αποθήκευση λειτουργεί χωρίς δίκτυο και δεν γράφει σε production.
          </div>
        ) : activeRecords.map((record) => (
          <article key={record.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-cyan-700 px-3 py-1 text-xs font-black text-cyan-200">{moduleLabels[record.module]}</span>
              <span className="text-xs font-bold uppercase text-slate-400">{record.priority}</span>
            </div>
            <h3 className="mt-3 text-xl font-black text-white">{record.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{record.desiredOutcome}</p>
            <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-300">
              <strong className="text-white">Verify:</strong> {record.acceptanceEvidence}
            </div>
            <div className="mt-3 break-all font-mono text-[11px] text-emerald-300">SHA-256 {record.sha256}</div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>{new Date(record.createdAt).toLocaleString()}</span>
              <span>{record.maxActions} actions · {record.maxMinutes} min · offline only</span>
            </div>
            <button type="button" disabled={busy} onClick={() => void removeFromDevice(record.id)} className="mt-4 min-h-11 rounded-xl border border-slate-700 px-4 text-sm font-bold text-slate-300 disabled:opacity-50">Διαγραφή από τη συσκευή</button>
          </article>
        ))}
      </section>
    </div>
  );
}
