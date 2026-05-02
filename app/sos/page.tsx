"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PantavionSosContact,
  PantavionSosDispatchResult,
  PantavionSosLocation,
  PantavionSosPacket,
  PantavionSosProfile,
} from "@/types/pantavion-sos";
import {
  createDefaultSosProfile,
  createPantavionId,
  createSosPacket,
  loadSosProfile,
  loadSosQueue,
  queueSosPacket,
  saveSosProfile,
  saveSosQueue,
} from "@/core/emergency/sos-storage";

function toSosLocation(position: GeolocationPosition): PantavionSosLocation {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: Number.isFinite(position.coords.accuracy)
      ? position.coords.accuracy
      : null,
    altitude: position.coords.altitude,
    heading: position.coords.heading,
    speed: position.coords.speed,
    timestamp: new Date(position.timestamp).toISOString(),
  };
}

async function postSosPacket(packet: PantavionSosPacket) {
  const response = await fetch("/api/sos/dispatch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(packet),
  });

  return (await response.json()) as PantavionSosDispatchResult;
}

export default function SOSPage() {
  const [profile, setProfile] = useState<PantavionSosProfile>(
    createDefaultSosProfile()
  );
  const [location, setLocation] = useState<PantavionSosLocation | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [status, setStatus] = useState("SOS system ready.");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [visualBeacon, setVisualBeacon] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    setProfile(loadSosProfile());
    setQueueCount(loadSosQueue().length);
  }, []);

  useEffect(() => {
    const onlineHandler = () => {
      replayQueuedSos();
    };

    window.addEventListener("online", onlineHandler);
    return () => window.removeEventListener("online", onlineHandler);
  }, []);

  const currentPacket = useMemo(
    () => createSosPacket(profile, location, !navigator.onLine),
    [profile, location]
  );

  function updateProfile<K extends keyof PantavionSosProfile>(
    key: K,
    value: PantavionSosProfile[K]
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function saveProfileNow() {
    saveSosProfile(profile);
    setStatus("Emergency profile saved on this device.");
    setError("");
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

  function captureLocation() {
    setError("");

    if (!("geolocation" in navigator)) {
      setError("This device/browser does not support geolocation.");
      return;
    }

    setStatus("Requesting location permission...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(toSosLocation(position));
        setStatus("Location captured.");
      },
      (locationError) => {
        setError(locationError.message || "Location permission failed.");
        setStatus("Location unavailable.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function startLiveLocation() {
    setError("");

    if (!("geolocation" in navigator)) {
      setError("This device/browser does not support live geolocation.");
      return;
    }

    if (watchIdRef.current !== null) {
      setStatus("Live location is already active.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(toSosLocation(position));
        setStatus("Live location active.");
      },
      (locationError) => {
        setError(locationError.message || "Live location failed.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    setStatus("Starting live location...");
  }

  function stopLiveLocation() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setStatus("Live location stopped.");
    }
  }

  function vibrateSos() {
    const nav = navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean;
    };

    if (typeof nav.vibrate === "function") {
      nav.vibrate([500, 200, 500, 200, 1000]);
      setStatus("SOS vibration sent to device.");
      return;
    }

    setError("Vibration/haptic alert is not supported on this device/browser.");
  }

  function playSosSound() {
    type AudioWindow = Window &
      typeof globalThis & {
        webkitAudioContext?: typeof AudioContext;
      };

    const audioWindow = window as AudioWindow;
    const AudioCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;

    if (!AudioCtor) {
      setError("AudioContext is not supported on this device/browser.");
      return;
    }

    const audio = new AudioCtor();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audio.currentTime);
    oscillator.frequency.setValueAtTime(1320, audio.currentTime + 0.35);
    oscillator.frequency.setValueAtTime(880, audio.currentTime + 0.7);

    gain.gain.setValueAtTime(0.001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, audio.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 1.2);

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 1.25);
    oscillator.onended = () => {
      audio.close().catch(() => undefined);
    };

    setStatus("SOS sound emitted.");
  }

  async function activateSosNow() {
    setError("");
    setSending(true);
    saveSosProfile(profile);

    if (!profile.consent) {
      setSending(false);
      setError("Consent must be enabled before SOS can use emergency profile data.");
      return;
    }

    vibrateSos();
    setVisualBeacon(true);

    const packet = createSosPacket(profile, location, !navigator.onLine);

    if (!navigator.onLine) {
      queueSosPacket(packet);
      setQueueCount(loadSosQueue().length);
      setSending(false);
      setStatus("Device is offline. SOS packet saved in local queue.");
      return;
    }

    try {
      const result = await postSosPacket(packet);

      if (!result.ok) {
        queueSosPacket(packet);
        setQueueCount(loadSosQueue().length);
        setError(result.message);
        setStatus("SOS kept locally because dispatch was not fully delivered.");
        return;
      }

      setStatus(result.message);
    } catch {
      queueSosPacket(packet);
      setQueueCount(loadSosQueue().length);
      setError("Network/API dispatch failed. SOS packet saved in local queue.");
    } finally {
      setSending(false);
    }
  }

  async function replayQueuedSos() {
    setError("");

    const queue = loadSosQueue();

    if (!queue.length) {
      setQueueCount(0);
      setStatus("No queued SOS packets.");
      return;
    }

    if (!navigator.onLine) {
      setStatus("Still offline. Queued SOS packets remain stored locally.");
      return;
    }

    setStatus("Replaying queued SOS packets...");
    const remaining: PantavionSosPacket[] = [];

    for (const packet of queue) {
      try {
        const result = await postSosPacket({
          ...packet,
          offlineQueued: false,
          deliveryAttempts: packet.deliveryAttempts + 1,
        });

        if (!result.ok) {
          remaining.push(packet);
        }
      } catch {
        remaining.push(packet);
      }
    }

    saveSosQueue(remaining);
    setQueueCount(remaining.length);

    if (remaining.length === 0) {
      setStatus("All queued SOS packets replayed.");
    } else {
      setStatus(`${remaining.length} SOS packet(s) still queued.`);
    }
  }

  function callEmergencyNumber() {
    if (!profile.emergencyNumber.trim()) {
      setError("Emergency number is empty.");
      return;
    }

    window.location.href = `tel:${profile.emergencyNumber.trim()}`;
  }

  function smsFirstContact() {
    const firstContact = profile.contacts.find((contact) =>
      contact.phone.trim()
    );

    if (!firstContact) {
      setError("Add at least one emergency contact with phone number.");
      return;
    }

    window.location.href = `sms:${firstContact.phone.trim()}?&body=${encodeURIComponent(
      currentPacket.message
    )}`;
  }

  async function copyPacket() {
    try {
      await navigator.clipboard.writeText(currentPacket.message);
      setStatus("SOS packet copied.");
      setError("");
    } catch {
      setError("Clipboard is not available on this device/browser.");
    }
  }

  async function sharePacket() {
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };

    try {
      if (typeof nav.share === "function") {
        await nav.share({
          title: "Pantavion SOS",
          text: currentPacket.message,
        });
        setStatus("SOS packet shared.");
        return;
      }

      await copyPacket();
    } catch {
      setError("Share failed or was cancelled.");
    }
  }

  function downloadPacket() {
    const blob = new Blob([JSON.stringify(currentPacket, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `pantavion-sos-${currentPacket.id}.json`;
    link.click();

    URL.revokeObjectURL(url);
    setStatus("SOS packet downloaded.");
  }

  function openMap() {
    if (!location) {
      setError("Capture location first.");
      return;
    }

    window.open(
      `https://www.google.com/maps?q=${location.lat},${location.lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      {visualBeacon ? (
        <button
          onClick={() => setVisualBeacon(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-red-600 text-center text-5xl font-black text-white animate-pulse"
        >
          SOS ACTIVE — TAP TO CLOSE VISUAL BEACON
        </button>
      ) : null}

      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="rounded-[2rem] border border-red-400/40 bg-gradient-to-br from-[#27070b] via-[#0d1020] to-black p-8 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/pantavion/emergency"
              className="rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-semibold text-yellow-100 hover:bg-yellow-300/10"
            >
              ← Back to Emergency System
            </Link>

            <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
              Queued SOS: {queueCount}
            </div>
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.35em] text-red-300">
            Live Pantavion SOS
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-bold leading-tight md:text-6xl">
            Real SOS Command Center
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-200">
            This is an operational browser/PWA SOS layer. It stores emergency
            data locally, captures location, queues SOS offline, replays queued
            packets, calls, sends SMS, shares packets, downloads packets, and
            posts to the Pantavion SOS API.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <button
              onClick={activateSosNow}
              disabled={sending}
              className="rounded-2xl border border-red-200/50 bg-red-600 px-5 py-5 text-left text-xl font-black text-white hover:bg-red-500 disabled:opacity-60"
            >
              {sending ? "SENDING SOS..." : "ACTIVATE SOS NOW"}
            </button>

            <button
              onClick={captureLocation}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10"
            >
              Capture location
            </button>

            <button
              onClick={startLiveLocation}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10"
            >
              Start live tracking
            </button>

            <button
              onClick={stopLiveLocation}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10"
            >
              Stop live tracking
            </button>

            <button
              onClick={callEmergencyNumber}
              className="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-5 py-4 text-left font-bold text-yellow-100 hover:bg-yellow-300/20"
            >
              Call emergency number
            </button>

            <button
              onClick={smsFirstContact}
              className="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-5 py-4 text-left font-bold text-yellow-100 hover:bg-yellow-300/20"
            >
              SMS first contact
            </button>

            <button
              onClick={sharePacket}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10"
            >
              Share SOS packet
            </button>

            <button
              onClick={copyPacket}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10"
            >
              Copy SOS packet
            </button>

            <button
              onClick={downloadPacket}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10"
            >
              Download SOS packet
            </button>

            <button
              onClick={replayQueuedSos}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10"
            >
              Replay queued SOS
            </button>

            <button
              onClick={() => setVisualBeacon(true)}
              className="rounded-2xl border border-red-300/30 bg-red-500/20 px-5 py-4 text-left font-bold text-red-100 hover:bg-red-500/30"
            >
              Start visual beacon
            </button>

            <button
              onClick={playSosSound}
              className="rounded-2xl border border-red-300/30 bg-red-500/20 px-5 py-4 text-left font-bold text-red-100 hover:bg-red-500/30"
            >
              Emit SOS sound
            </button>

            <button
              onClick={vibrateSos}
              className="rounded-2xl border border-red-300/30 bg-red-500/20 px-5 py-4 text-left font-bold text-red-100 hover:bg-red-500/30"
            >
              Vibrate SOS
            </button>

            <button
              onClick={openMap}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10"
            >
              Open map
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-200">
              Live Status
            </p>
            <p className="mt-3 text-lg text-white">{status}</p>
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            <p className="mt-3 text-sm text-slate-300">
              Network: {typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline"}
            </p>
            {location ? (
              <p className="mt-2 text-sm text-slate-300">
                Location: {location.lat}, {location.lng} | accuracy{" "}
                {location.accuracy ?? "unknown"}m
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                No location captured yet.
              </p>
            )}
          </div>
        </div>

        <section className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-yellow-200">
                Live Emergency Profile
              </h2>

              <button
                onClick={saveProfileNow}
                className="rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-bold text-yellow-100 hover:bg-yellow-300/10"
              >
                Save profile
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                I consent to Pantavion using this emergency data for SOS
                actions, local storage, offline queue, sharing, SMS/call actions,
                and backend dispatch where configured.
              </span>
            </label>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-yellow-200">
                Emergency Contacts
              </h2>

              <button
                onClick={addContact}
                className="rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-bold text-yellow-100 hover:bg-yellow-300/10"
              >
                Add contact
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {profile.contacts.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No contacts yet. Add at least one phone number for SMS.
                </p>
              ) : null}

              {profile.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="grid gap-3">
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
                    Remove contact
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold text-yellow-200">
            Current Live SOS Packet
          </h2>

          <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-200">
            {currentPacket.message}
          </pre>
        </section>
      </section>
    </main>
  );
}
