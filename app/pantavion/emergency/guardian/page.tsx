"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createSosPacket,
  loadSosProfile,
  queueSosPacket,
} from "@/core/emergency/sos-storage";
import type { PantavionSosLocation, PantavionSosProfile } from "@/types/pantavion-sos";

type GuardianPlan = {
  scenario: string;
  destination: string;
  routeNotes: string;
  deadlineLocal: string;
  checkInMinutes: number;
  consent: boolean;
  startedAt: string;
  active: boolean;
  escalated: boolean;
};

const GUARDIAN_KEY = "pantavion.guardian.plan.v1";

const scenarioOptions = [
  "Travel",
  "Car trip",
  "Hunter / remote terrain",
  "Mountain / hiking",
  "Sea / boat",
  "Work in isolated area",
  "Earthquake / disaster risk",
  "War / unrest / evacuation",
];

function defaultPlan(): GuardianPlan {
  const deadline = new Date(Date.now() + 60 * 60 * 1000);
  return {
    scenario: "Travel",
    destination: "",
    routeNotes: "",
    deadlineLocal: deadline.toISOString().slice(0, 16),
    checkInMinutes: 30,
    consent: false,
    startedAt: "",
    active: false,
    escalated: false,
  };
}

function loadPlan(): GuardianPlan {
  if (typeof window === "undefined") return defaultPlan();

  try {
    const raw = window.localStorage.getItem(GUARDIAN_KEY);
    if (!raw) return defaultPlan();
    return { ...defaultPlan(), ...(JSON.parse(raw) as Partial<GuardianPlan>) };
  } catch {
    return defaultPlan();
  }
}

function savePlan(plan: GuardianPlan) {
  window.localStorage.setItem(GUARDIAN_KEY, JSON.stringify(plan));
}

function toLocation(position: GeolocationPosition): PantavionSosLocation {
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

export default function GuardianModePage() {
  const [plan, setPlan] = useState<GuardianPlan>(defaultPlan());
  const [profile, setProfile] = useState<PantavionSosProfile | null>(null);
  const [location, setLocation] = useState<PantavionSosLocation | null>(null);
  const [now, setNow] = useState(Date.now());
  const [status, setStatus] = useState("Guardian Mode ready.");
  const [error, setError] = useState("");

  useEffect(() => {
    setPlan(loadPlan());
    setProfile(loadSosProfile());
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const deadlineTime = useMemo(
    () => new Date(plan.deadlineLocal).getTime(),
    [plan.deadlineLocal]
  );

  const remainingMs = deadlineTime - now;
  const remainingLabel =
    remainingMs > 0
      ? `${Math.floor(remainingMs / 60000)}m ${Math.floor((remainingMs % 60000) / 1000)}s`
      : "deadline passed";

  useEffect(() => {
    if (!plan.active || plan.escalated || !plan.consent) return;
    if (remainingMs > 0) return;

    const currentProfile = profile ?? loadSosProfile();
    const packet = createSosPacket(currentProfile, location, !navigator.onLine);
    queueSosPacket(packet);

    const nextPlan = { ...plan, escalated: true };
    setPlan(nextPlan);
    savePlan(nextPlan);

    setStatus(
      "Missed check-in: SOS packet queued locally. If the device is online, open /sos and replay queued SOS."
    );
  }, [remainingMs, plan, profile, location]);

  function updatePlan<K extends keyof GuardianPlan>(key: K, value: GuardianPlan[K]) {
    const next = { ...plan, [key]: value };
    setPlan(next);
    savePlan(next);
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
        setLocation(toLocation(position));
        setStatus("Location captured for Guardian Mode.");
      },
      (locationError) => {
        setError(locationError.message || "Location permission failed.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function startGuardian() {
    setError("");

    if (!plan.consent) {
      setError("Consent is required before Guardian Mode can arm a missed-check-in SOS.");
      return;
    }

    if (!profile) {
      setProfile(loadSosProfile());
    }

    const next = {
      ...plan,
      active: true,
      escalated: false,
      startedAt: new Date().toISOString(),
    };

    setPlan(next);
    savePlan(next);
    setStatus("Guardian Mode armed. If check-in is missed while this page/PWA is active, an SOS packet will be queued.");
  }

  function checkInSafe() {
    const deadline = new Date(Date.now() + plan.checkInMinutes * 60 * 1000);
    const next = {
      ...plan,
      deadlineLocal: deadline.toISOString().slice(0, 16),
      active: true,
      escalated: false,
    };

    setPlan(next);
    savePlan(next);
    setStatus("Check-in received. Guardian deadline extended.");
  }

  function stopGuardian() {
    const next = { ...plan, active: false };
    setPlan(next);
    savePlan(next);
    setStatus("Guardian Mode stopped.");
  }

  function forceQueueTestSos() {
    const currentProfile = profile ?? loadSosProfile();
    const packet = createSosPacket(currentProfile, location, !navigator.onLine);
    queueSosPacket(packet);
    setStatus("TEST SOS packet queued locally. Open /sos to replay queued SOS.");
  }

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-yellow-400/25 bg-gradient-to-br from-[#081229] via-[#07101f] to-black p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
          Pantavion No-Touch SOS
        </p>

        <h1 className="mt-4 text-4xl font-bold md:text-6xl">
          Guardian Mode
        </h1>

        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200">
          Activate this before travel, driving, hunting, hiking, sea travel,
          disaster exposure, or isolated work. If you miss check-in while this
          page/PWA is active, Pantavion queues an SOS packet for your trusted
          contacts. This does not replace official emergency services.
        </p>

        <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-red-50">
          <p className="font-bold">Truth boundary</p>
          <p className="mt-2 text-sm leading-6">
            Browser/PWA Guardian Mode can run while the page/app is active.
            Reliable background crash/fall/no-movement detection requires a
            future native app, operating-system permissions, and/or wearable or
            certified hardware support.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Scenario</span>
            <select
              value={plan.scenario}
              onChange={(event) => updatePlan("scenario", event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
            >
              {scenarioOptions.map((scenario) => (
                <option key={scenario}>{scenario}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Deadline / expected safe check-in</span>
            <input
              type="datetime-local"
              value={plan.deadlineLocal}
              onChange={(event) => updatePlan("deadlineLocal", event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
            />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-slate-300">Destination / route</span>
            <input
              value={plan.destination}
              onChange={(event) => updatePlan("destination", event.target.value)}
              placeholder="Example: Troodos mountain route, forest road, remote hunting area, sea route..."
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
            />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-slate-300">Route notes / risk notes</span>
            <textarea
              value={plan.routeNotes}
              onChange={(event) => updatePlan("routeNotes", event.target.value)}
              rows={4}
              placeholder="Vehicle, plate, group, planned route, weather, terrain, medical risk, hunting area, expected return..."
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Extend check-in by minutes</span>
            <input
              type="number"
              min={5}
              max={1440}
              value={plan.checkInMinutes}
              onChange={(event) =>
                updatePlan("checkInMinutes", Number(event.target.value))
              }
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
            />
          </label>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm text-slate-300">Guardian status</p>
            <p className="mt-2 text-2xl font-bold text-yellow-200">
              {plan.active ? "ARMED" : "NOT ARMED"}
            </p>
            <p className="mt-2 text-sm text-slate-300">Time left: {remainingLabel}</p>
            <p className="mt-1 text-sm text-slate-300">
              Escalated: {plan.escalated ? "yes" : "no"}
            </p>
          </div>
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4">
          <input
            type="checkbox"
            checked={plan.consent}
            onChange={(event) => updatePlan("consent", event.target.checked)}
            className="mt-1"
          />
          <span className="text-sm leading-6 text-yellow-50">
            I consent to Pantavion Guardian Mode storing this plan locally,
            using my emergency profile and last known location, and queuing an
            SOS packet to my trusted-contact flow if I miss check-in. I understand
            official emergency services are not dispatched unless verified
            institutional integrations exist.
          </span>
        </label>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button onClick={captureLocation} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">
            Capture location
          </button>
          <button onClick={startGuardian} className="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-5 py-4 text-left font-bold text-yellow-100 hover:bg-yellow-300/20">
            Start Guardian Mode
          </button>
          <button onClick={checkInSafe} className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-5 py-4 text-left font-bold text-emerald-100 hover:bg-emerald-300/20">
            I am safe / extend check-in
          </button>
          <button onClick={stopGuardian} className="rounded-2xl border border-red-300/30 bg-red-500/10 px-5 py-4 text-left font-bold text-red-100 hover:bg-red-500/20">
            Stop Guardian
          </button>
          <button onClick={forceQueueTestSos} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">
            Queue TEST SOS packet
          </button>
          <a href="/sos" className="rounded-2xl border border-red-300/30 bg-red-600 px-5 py-4 text-left font-bold text-white hover:bg-red-500">
            Open Real SOS
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="font-semibold text-yellow-200">Status</p>
          <p className="mt-2 text-slate-200">{status}</p>
          {error ? <p className="mt-2 text-red-300">{error}</p> : null}
          {location ? (
            <p className="mt-2 text-sm text-slate-300">
              Location: {location.lat}, {location.lng} | accuracy {location.accuracy ?? "unknown"}m
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">No location captured yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
