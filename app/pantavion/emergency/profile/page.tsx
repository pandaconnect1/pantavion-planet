"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  PantavionSosContact,
  PantavionSosProfile,
} from "@/types/pantavion-sos";
import {
  createDefaultSosProfile,
  createPantavionId,
  loadSosProfile,
  saveSosProfile,
} from "@/core/emergency/sos-storage";

export default function EmergencyProfilePage() {
  const [profile, setProfile] = useState<PantavionSosProfile>(
    createDefaultSosProfile()
  );
  const [status, setStatus] = useState("Profile ready.");

  useEffect(() => {
    setProfile(loadSosProfile());
  }, []);

  function updateProfile<K extends keyof PantavionSosProfile>(
    key: K,
    value: PantavionSosProfile[K]
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function addContact() {
    const contact: PantavionSosContact = {
      id: createPantavionId("contact"),
      name: "",
      phone: "",
      email: "",
      relation: "",
    };

    setProfile((current) => ({
      ...current,
      contacts: [...current.contacts, contact],
    }));
  }

  function updateContact(
    id: string,
    field: keyof PantavionSosContact,
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      contacts: current.contacts.map((contact) =>
        contact.id === id ? { ...contact, [field]: value } : contact
      ),
    }));
  }

  function removeContact(id: string) {
    setProfile((current) => ({
      ...current,
      contacts: current.contacts.filter((contact) => contact.id !== id),
    }));
  }

  function save() {
    saveSosProfile(profile);
    setStatus("Emergency profile saved on this device.");
  }

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-yellow-400/25 bg-gradient-to-br from-[#081229] via-[#07101f] to-black p-8 shadow-2xl">
        <Link
          href="/pantavion/emergency"
          className="inline-flex rounded-full border border-yellow-300/40 px-4 py-2 text-sm font-semibold text-yellow-100 hover:bg-yellow-300/10"
        >
          ← Back to Emergency System
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
          Live Emergency Profile
        </p>

        <h1 className="mt-4 text-4xl font-bold md:text-5xl">
          Pantavion SOS Profile
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
          This is not static. The profile is saved locally and used by the real SOS page.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <input
            value={profile.fullName}
            onChange={(event) => updateProfile("fullName", event.target.value)}
            placeholder="Full name"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
          />

          <input
            value={profile.primaryLanguage}
            onChange={(event) =>
              updateProfile("primaryLanguage", event.target.value)
            }
            placeholder="Primary language"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
          />

          <input
            value={profile.emergencyNumber}
            onChange={(event) =>
              updateProfile("emergencyNumber", event.target.value)
            }
            placeholder="Emergency number"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
          />

          <input
            value={profile.bloodType}
            onChange={(event) => updateProfile("bloodType", event.target.value)}
            placeholder="Blood type"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
          />

          <textarea
            value={profile.medicalNotes}
            onChange={(event) =>
              updateProfile("medicalNotes", event.target.value)
            }
            placeholder="Medical notes"
            rows={4}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none md:col-span-2"
          />

          <textarea
            value={profile.allergies}
            onChange={(event) => updateProfile("allergies", event.target.value)}
            placeholder="Allergies"
            rows={3}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none md:col-span-2"
          />
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4">
          <input
            type="checkbox"
            checked={profile.consent}
            onChange={(event) => updateProfile("consent", event.target.checked)}
            className="mt-1"
          />
          <span className="text-sm leading-6 text-yellow-50">
            I consent to Pantavion using this emergency data for SOS actions,
            local storage, offline queue, sharing, SMS/call actions, and backend
            dispatch where configured.
          </span>
        </label>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-yellow-200">
              Emergency contacts
            </h2>

            <button
              onClick={addContact}
              className="rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-bold text-yellow-100 hover:bg-yellow-300/10"
            >
              Add contact
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {profile.contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={contact.name}
                    onChange={(event) =>
                      updateContact(contact.id, "name", event.target.value)
                    }
                    placeholder="Name"
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                  />

                  <input
                    value={contact.phone}
                    onChange={(event) =>
                      updateContact(contact.id, "phone", event.target.value)
                    }
                    placeholder="Phone"
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                  />

                  <input
                    value={contact.email}
                    onChange={(event) =>
                      updateContact(contact.id, "email", event.target.value)
                    }
                    placeholder="Email"
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                  />

                  <input
                    value={contact.relation}
                    onChange={(event) =>
                      updateContact(contact.id, "relation", event.target.value)
                    }
                    placeholder="Relation"
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                  />
                </div>

                <button
                  onClick={() => removeContact(contact.id)}
                  className="mt-3 rounded-full border border-red-300/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-500/10"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={save}
            className="rounded-full border border-yellow-300/30 px-5 py-3 font-bold text-yellow-100 hover:bg-yellow-300/10"
          >
            Save live profile
          </button>

          <Link
            href="/sos"
            className="rounded-full border border-red-300/30 bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-500"
          >
            Open real SOS
          </Link>
        </div>

        <p className="mt-5 text-sm text-slate-300">{status}</p>
      </section>
    </main>
  );
}
