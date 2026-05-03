"use client";

import { useState } from "react";
import {
  institutionalEmergencyPartnership,
  partnerTypes,
} from "@/core/emergency/institutional-partnership";

export default function EmergencyPartnersPage() {
  const [form, setForm] = useState({
    organizationName: "",
    country: "",
    partnerType: partnerTypes[0],
    officialEmail: "",
    publicWebsite: "",
    role: "",
    legalContact: "",
    technicalContact: "",
    integrationInterest: "",
    consent: false,
  });

  const [status, setStatus] = useState("Partner gateway ready.");
  const [error, setError] = useState("");

  function update(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitInterest() {
    setError("");

    if (!form.consent) {
      setError("Consent is required before submitting institutional interest.");
      return;
    }

    try {
      const response = await fetch("/api/emergency/partner-interest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as { ok: boolean; message: string };

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setStatus(result.message);
    } catch {
      setError("Partner interest API failed. Please try again later.");
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-yellow-400/25 bg-gradient-to-br from-[#081229] via-[#07101f] to-black p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
          Official Integration Gateway
        </p>

        <h1 className="mt-4 text-4xl font-bold md:text-6xl">
          {institutionalEmergencyPartnership.title}
        </h1>

        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200">
          {institutionalEmergencyPartnership.invitation}
        </p>

        <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-red-50">
          <p className="font-bold">Institutional truth boundary</p>
          <p className="mt-2 text-sm leading-6">
            {institutionalEmergencyPartnership.hardBoundary}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <input value={form.organizationName} onChange={(event) => update("organizationName", event.target.value)} placeholder="Official organization name" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" />
          <input value={form.country} onChange={(event) => update("country", event.target.value)} placeholder="Country / jurisdiction" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" />

          <select value={form.partnerType} onChange={(event) => update("partnerType", event.target.value)} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            {partnerTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <input value={form.officialEmail} onChange={(event) => update("officialEmail", event.target.value)} placeholder="Official email" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" />
          <input value={form.publicWebsite} onChange={(event) => update("publicWebsite", event.target.value)} placeholder="Public website" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" />
          <input value={form.role} onChange={(event) => update("role", event.target.value)} placeholder="Role / department" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" />
          <input value={form.legalContact} onChange={(event) => update("legalContact", event.target.value)} placeholder="Legal contact" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" />
          <input value={form.technicalContact} onChange={(event) => update("technicalContact", event.target.value)} placeholder="Technical contact" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" />

          <textarea value={form.integrationInterest} onChange={(event) => update("integrationInterest", event.target.value)} placeholder="Integration interest / emergency use case / country need" rows={5} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 md:col-span-2" />
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4">
          <input type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} className="mt-1" />
          <span className="text-sm leading-6 text-yellow-50">
            I confirm this is an official institutional or partner inquiry. I understand this does not create dispatch authority, emergency routing, or legal integration until Pantavion and the institution complete verified agreements and technical approval.
          </span>
        </label>

        <button onClick={submitInterest} className="mt-6 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-5 py-4 font-bold text-yellow-100 hover:bg-yellow-300/20">
          Submit official partnership interest
        </button>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="font-semibold text-yellow-200">Status</p>
          <p className="mt-2 text-slate-200">{status}</p>
          {error ? <p className="mt-2 text-red-300">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
