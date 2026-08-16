"use client";

import { useState } from "react";

type GeoViewport = {
  minLatitude: number;
  minLongitude: number;
  maxLatitude: number;
  maxLongitude: number;
  radiusMeters: number;
};

type GeoAssessment = {
  status: string;
  requestedSurface: string;
  latitudeRounded?: number;
  longitudeRounded?: number;
  accuracyMeters?: number;
  viewport?: GeoViewport;
  canOpenCurrentArea: boolean;
  canSearchNearbyRoads: boolean;
  canBindToDwgViewport: boolean;
  preciseLocationStored: false;
  continuousTracking: false;
  backgroundTracking: false;
  notes: string[];
};

export function DeviceGeoStatusClient() {
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<GeoAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendPosition(position: GeolocationPosition) {
    const response = await fetch("/api/kernel/device-geo-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
        altitudeMeters: position.coords.altitude,
        headingDegrees: position.coords.heading,
        speedMetersPerSecond: position.coords.speed,
        source: "browser_geolocation",
        requestedSurface: "C",
        consentGranted: true,
        ephemeralOnly: true,
        actor: "client:water:geo-status",
        reason: "Open current device area for Pantavion Water viewport"
      })
    });

    const data = (await response.json()) as {
      ok: boolean;
      assessment?: GeoAssessment;
      error?: string;
    };

    if (!response.ok || !data.ok || !data.assessment) {
      throw new Error(data.error || "Geo status request failed.");
    }

    setAssessment(data.assessment);
  }

  function requestCurrentPosition() {
    setError(null);
    setAssessment(null);

    if (!("geolocation" in navigator)) {
      setError("Η συσκευή/browser δεν υποστηρίζει geolocation.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await sendPosition(position);
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : String(requestError));
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setLoading(false);
        setError(`Δεν δόθηκε τοποθεσία ή απέτυχε το GPS permission: ${geoError.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  }

  return (
    <section className="rounded-3xl border border-[#f6d37a]/25 bg-[#050814] p-7 text-white shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-[#f6d37a]">
            Pantavion Geo Status
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Current Device Position Viewport
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65">
            Παίρνει πραγματική θέση από τη συσκευή με browser permission και
            υπολογίζει viewport/bbox για να ανοίγει μόνο η περιοχή που είσαι,
            όχι ολόκληρος ο χάρτης ή DWG.
          </p>
        </div>

        <span className="rounded-full border border-[#f6d37a]/30 bg-[#f6d37a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6d37a]">
          real browser GPS
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
        Δεν γίνεται συνεχής παρακολούθηση. Δεν γίνεται background tracking.
        Η θέση χρησιμοποιείται για υπολογισμό περιοχής/viewport.
      </div>

      <button
        type="button"
        onClick={requestCurrentPosition}
        disabled={loading}
        className="mt-6 rounded-2xl bg-[#f6d37a] px-5 py-3 text-sm font-semibold text-[#050814] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Reading GPS..." : "Use my current location"}
      </button>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {assessment ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">
              Device position
            </p>
            <div className="mt-3 space-y-2 text-sm text-white/75">
              <p>Status: {assessment.status}</p>
              <p>Surface: {assessment.requestedSurface}</p>
              <p>Latitude: {assessment.latitudeRounded}</p>
              <p>Longitude: {assessment.longitudeRounded}</p>
              <p>Accuracy: {assessment.accuracyMeters} m</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">
              Viewport bbox
            </p>
            {assessment.viewport ? (
              <div className="mt-3 space-y-2 text-sm text-white/75">
                <p>Radius: {assessment.viewport.radiusMeters} m</p>
                <p>Min lat: {assessment.viewport.minLatitude}</p>
                <p>Min lng: {assessment.viewport.minLongitude}</p>
                <p>Max lat: {assessment.viewport.maxLatitude}</p>
                <p>Max lng: {assessment.viewport.maxLongitude}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/60">No viewport yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-[#f6d37a]/20 bg-[#f6d37a]/10 p-4 text-sm text-[#f7e5ad] md:col-span-2">
            Ready for next step: connect this viewport to road/zone search index
            and then to DWG adapter viewport rendering.
          </div>
        </div>
      ) : null}
    </section>
  );
}
