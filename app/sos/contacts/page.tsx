"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PantavionSosContact, PantavionSosProfile } from "@/types/pantavion-sos";
import {
  createDefaultSosProfile,
  createPantavionId,
  loadSosProfile,
  saveSosProfile
} from "@/core/emergency/sos-storage";

const MAX_CONTACTS = 3;

function createEmptyContact(): PantavionSosContact {
  return {
    id: createPantavionId("trusted-contact"),
    name: "",
    phone: "",
    email: "",
    relation: ""
  };
}

function cleanPhone(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function buildTrustedMessage(profile: PantavionSosProfile) {
  const name = profile.fullName || "Pantavion user";
  const language = profile.primaryLanguage || "not set";
  const medical = profile.medicalNotes || "none provided";
  const allergies = profile.allergies || "none provided";

  return [
    "PANTAVION TRUSTED CONTACT ALERT",
    "",
    `${name} may need help or a safety check.`,
    `Primary language: ${language}`,
    `Medical notes: ${medical}`,
    `Allergies: ${allergies}`,
    "",
    "This alert is prepared by Pantavion LifeShield.",
    "It does not replace official emergency services.",
    "If there is immediate danger, use the local emergency number."
  ].join("\n");
}

export default function SosContactsPage() {
  const [profile, setProfile] = useState<PantavionSosProfile>(createDefaultSosProfile());
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setProfile(loadSosProfile());
  }, []);

  const contacts = profile.contacts.slice(0, MAX_CONTACTS);
  const trustedMessage = useMemo(() => buildTrustedMessage(profile), [profile]);

  function updateProfile<K extends keyof PantavionSosProfile>(
    key: K,
    value: PantavionSosProfile[K]
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function addContact() {
    if (contacts.length >= MAX_CONTACTS) return;

    setProfile((current) => ({
      ...current,
      contacts: [...current.contacts.slice(0, MAX_CONTACTS), createEmptyContact()].slice(
        0,
        MAX_CONTACTS
      )
    }));

    setSaved(false);
  }

  function updateContact(id: string, field: keyof PantavionSosContact, value: string) {
    setProfile((current) => ({
      ...current,
      contacts: current.contacts.map((contact) =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    }));

    setSaved(false);
  }

  function removeContact(id: string) {
    setProfile((current) => ({
      ...current,
      contacts: current.contacts.filter((contact) => contact.id !== id)
    }));

    setSaved(false);
  }

  function saveContacts() {
    saveSosProfile({
      ...profile,
      contacts: profile.contacts.slice(0, MAX_CONTACTS)
    });

    setSaved(true);
    setCopied(false);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(trustedMessage);
      setCopied(true);
    } catch {
      setCopied(false);
      window.alert("Clipboard is not available. You can still use SMS, call, email, or share.");
    }
  }

  async function shareMessage() {
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };

    if (typeof nav.share === "function") {
      await nav.share({
        title: "Pantavion Trusted Contact Alert",
        text: trustedMessage
      });
      return;
    }

    await copyMessage();
  }

  return (
    <main className="min-h-screen bg-[#050816] px-5 py-8 text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/sos"
            className="rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-semibold text-yellow-100 hover:bg-yellow-300/10"
          >
            ← Back to SOS
          </Link>

          <Link
            href="/feedback"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Report problem
          </Link>
        </div>

        <section className="rounded-[2rem] border border-red-400/35 bg-gradient-to-br from-[#2b070b] via-[#101827] to-black p-6 shadow-2xl md:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-red-200">
            Pantavion LifeShield
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            Trusted SOS Contacts
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200">
            Save up to three trusted people on this device. Pantavion can prepare
            call, SMS, email, copy and share actions for them. This is the first
            emergency layer before any institutional integration exists.
          </p>

          <div className="mt-6 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-sm leading-6 text-yellow-50">
            <strong>Truth boundary:</strong> Pantavion does not claim automatic
            police, ambulance, state or satellite dispatch. Use your local emergency
            number immediately when there is direct danger.
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-2xl font-bold text-yellow-100">Emergency profile</h2>

            <label className="mt-5 block text-sm font-semibold text-slate-300">
              Full name
              <input
                value={profile.fullName}
                onChange={(event) => updateProfile("fullName", event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-300"
                placeholder="Name visible in SOS packet"
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-slate-300">
              Primary language
              <input
                value={profile.primaryLanguage}
                onChange={(event) =>
                  updateProfile("primaryLanguage", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-300"
                placeholder="Greek, English, Arabic..."
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-slate-300">
              Medical notes
              <textarea
                value={profile.medicalNotes}
                onChange={(event) => updateProfile("medicalNotes", event.target.value)}
                className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-300"
                placeholder="Medication, condition, mobility, disability..."
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-slate-300">
              Allergies
              <input
                value={profile.allergies}
                onChange={(event) => updateProfile("allergies", event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-300"
                placeholder="None, penicillin, food allergy..."
              />
            </label>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-yellow-100">
                Trusted contacts
              </h2>

              <button
                type="button"
                onClick={addContact}
                disabled={contacts.length >= MAX_CONTACTS}
                className="rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-45"
              >
                Add contact
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 text-slate-300">
                No trusted contacts saved yet. Add at least one parent, guardian,
                family member, friend, neighbor or coworker.
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-4">
              {contacts.map((contact, index) => {
                const phone = cleanPhone(contact.phone);
                const smsHref = phone
                  ? `sms:${phone}?&body=${encodeURIComponent(trustedMessage)}`
                  : "";
                const telHref = phone ? `tel:${phone}` : "";
                const mailHref = contact.email.trim()
                  ? `mailto:${contact.email.trim()}?subject=${encodeURIComponent(
                      "Pantavion trusted contact alert"
                    )}&body=${encodeURIComponent(trustedMessage)}`
                  : "";

                return (
                  <article
                    key={contact.id}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-white">Contact {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeContact(contact.id)}
                        className="rounded-full border border-red-300/40 px-3 py-1 text-xs font-bold text-red-100 hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <input
                        value={contact.name}
                        onChange={(event) =>
                          updateContact(contact.id, "name", event.target.value)
                        }
                        className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-300"
                        placeholder="Name"
                      />
                      <input
                        value={contact.relation}
                        onChange={(event) =>
                          updateContact(contact.id, "relation", event.target.value)
                        }
                        className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-300"
                        placeholder="Relation: parent, friend..."
                      />
                      <input
                        value={contact.phone}
                        onChange={(event) =>
                          updateContact(contact.id, "phone", event.target.value)
                        }
                        className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-300"
                        placeholder="Phone with country code"
                      />
                      <input
                        value={contact.email}
                        onChange={(event) =>
                          updateContact(contact.id, "email", event.target.value)
                        }
                        className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-300"
                        placeholder="Email, optional"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={telHref || undefined}
                        aria-disabled={!telHref}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-45"
                      >
                        Call
                      </a>
                      <a
                        href={smsHref || undefined}
                        aria-disabled={!smsHref}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-45"
                      >
                        SMS
                      </a>
                      <a
                        href={mailHref || undefined}
                        aria-disabled={!mailHref}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-45"
                      >
                        Email
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-2xl font-bold text-yellow-100">
            Prepared trusted-contact message
          </h2>

          <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/50 p-4 text-sm leading-6 text-slate-200">
            {trustedMessage}
          </pre>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveContacts}
              className="rounded-full bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-400"
            >
              Save trusted contacts
            </button>

            <button
              type="button"
              onClick={copyMessage}
              className="rounded-full border border-yellow-300/40 px-5 py-3 text-sm font-black text-yellow-100 hover:bg-yellow-300/10"
            >
              Copy message
            </button>

            <button
              type="button"
              onClick={shareMessage}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-slate-100 hover:bg-white/10"
            >
              Share message
            </button>

            <Link
              href="/sos"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-slate-100 hover:bg-white/10"
            >
              Open Live SOS
            </Link>
          </div>

          {saved ? (
            <p className="mt-4 text-sm font-bold text-green-200">
              Saved locally on this device. Live SOS can now use these contacts.
            </p>
          ) : null}

          {copied ? (
            <p className="mt-4 text-sm font-bold text-green-200">
              Trusted-contact message copied.
            </p>
          ) : null}
        </section>
      </section>
    </main>
  );
}
