"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Map as LeafletMap,
  CircleMarker as LeafletCircleMarker,
  Polyline as LeafletPolyline,
} from "leaflet";

type Candidate = {
  id: string;
  source: "pantavion" | "dls" | "osm";
  label: string;
  latitude: number;
  longitude: number;
  confidence: "verified" | "reference" | "external";
};

type SearchResponse = {
  ok?: boolean;
  error?: string;
  results?: Candidate[];
  protectedPantavionRegistryIncluded?: boolean;
};

type RouteResponse = {
  ok?: boolean;
  error?: string;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  geometry?: {
    type?: string;
    coordinates?: Array<[number, number]>;
  };
  steps?: Array<{
    distanceMeters?: number | null;
    durationSeconds?: number | null;
    roadName?: string;
    maneuverType?: string;
    maneuverModifier?: string;
    location?: [number, number] | null;
  }>;
};

type DeviceIdentity = {
  deviceId: string;
  deviceToken: string;
};

const DEVICE_ID_KEY = "pantavion:water:device-id:v1";
const DEVICE_TOKEN_KEY = "pantavion:water:device-token:v1";

function randomSecret() {
  if (window.crypto?.getRandomValues) {
    const values = window.crypto.getRandomValues(new Uint32Array(4));
    return Array.from(values)
      .map((value) => value.toString(36))
      .join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function waterDevice(): DeviceIdentity {
  let deviceId = window.localStorage.getItem(DEVICE_ID_KEY) || "";
  let deviceToken = window.localStorage.getItem(DEVICE_TOKEN_KEY) || "";

  if (!deviceId) {
    for (const key of [
      "pantavion_water_device_id",
      "pantavion-water-device-id",
      "waterDeviceId",
    ]) {
      const value = window.localStorage.getItem(key) || "";
      if (value) {
        deviceId = value;
        break;
      }
    }
  }

  if (!deviceToken) {
    for (const key of [
      "pantavion_water_device_token",
      "pantavion-water-device-token",
      "waterDeviceToken",
    ]) {
      const value = window.localStorage.getItem(key) || "";
      if (value) {
        deviceToken = value;
        break;
      }
    }
  }

  if (!deviceId) deviceId = `water-device-${Date.now().toString(36)}-${randomSecret()}`;
  if (!deviceToken) deviceToken = `water-token-${randomSecret()}-${randomSecret()}`;

  window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
  window.localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);

  return { deviceId, deviceToken };
}

function authHeaders() {
  const device = waterDevice();
  return {
    "x-pantavion-water-device-id": device.deviceId,
    "x-pantavion-water-device-token": device.deviceToken,
  };
}

function sourceLabel(source: Candidate["source"]) {
  if (source === "pantavion") return "Pantavion";
  if (source === "dls") return "Κτηματολόγιο";
  return "OpenStreetMap";
}

function metersText(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "—";
  if ((value ?? 0) < 1000) return `${Math.round(value ?? 0)} m`;
  return `${((value ?? 0) / 1000).toFixed(1)} km`;
}

function durationText(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "—";
  const minutes = Math.max(1, Math.round((value ?? 0) / 60));
  if (minutes < 60) return `${minutes} λεπτά`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}ω ${rest}λ` : `${hours}ω`;
}

function maneuverText(
  type?: string,
  modifier?: string,
  roadName?: string,
) {
  const road = roadName ? ` προς ${roadName}` : "";
  const direction =
    modifier === "left"
      ? "αριστερά"
      : modifier === "right"
        ? "δεξιά"
        : modifier === "slight left"
          ? "ελαφρά αριστερά"
          : modifier === "slight right"
            ? "ελαφρά δεξιά"
            : modifier === "sharp left"
              ? "απότομα αριστερά"
              : modifier === "sharp right"
                ? "απότομα δεξιά"
                : modifier === "uturn"
                  ? "αναστροφή"
                  : "ευθεία";

  if (type === "depart") return `Ξεκίνα ${direction}${road}`;
  if (type === "arrive") return "Άφιξη στον προορισμό";
  if (type === "roundabout" || type === "rotary") return `Μπες στον κυκλικό κόμβο${road}`;
  if (type === "turn") return `Στρίψε ${direction}${road}`;
  if (type === "merge") return `Ενώσου ${direction}${road}`;
  if (type === "fork") return `Κράτησε ${direction}${road}`;
  if (type === "continue") return `Συνέχισε ${direction}${road}`;
  return `Συνέχισε ${direction}${road}`;
}

export default function WaterLocationNavigationClient() {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const destinationMarkerRef = useRef<LeafletCircleMarker | null>(null);
  const positionMarkerRef = useRef<LeafletCircleMarker | null>(null);
  const routeLayerRef = useRef<LeafletPolyline | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [destination, setDestination] = useState<Candidate | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [message, setMessage] = useState(
    "Αναζήτησε οδό, αριθμό, κτίριο, ξενοδοχείο ή άλλη γνωστή τοποθεσία.",
  );
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newArea, setNewArea] = useState("");
  const [aliases, setAliases] = useState("");

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    void import("leaflet").then((module) => {
      if (cancelled || !mapEl.current) return;
      const L = module.default || module;
      map = L.map(mapEl.current, {
        center: [34.685, 33.04],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;
      window.setTimeout(() => map?.invalidateSize(), 300);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  async function locate() {
    if (!navigator.geolocation) {
      setMessage("Η συσκευή δεν παρέχει GPS.");
      return null;
    }

    setMessage("Εντοπίζω την τρέχουσα θέση...");
    return await new Promise<{
      latitude: number;
      longitude: number;
      accuracy: number;
    } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const point = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCurrentPosition(point);
          const L = await import("leaflet");
          positionMarkerRef.current?.remove();
          positionMarkerRef.current = (L.default || L)
            .circleMarker([point.latitude, point.longitude], {
              radius: 8,
              weight: 3,
              fillOpacity: 0.9,
            })
            .bindTooltip("Η θέση μου")
            .addTo(mapRef.current!);
          mapRef.current?.setView(
            [point.latitude, point.longitude],
            Math.max(mapRef.current.getZoom(), 17),
          );
          setMessage(
            `Βρέθηκε θέση GPS · ακρίβεια περίπου ${Math.round(point.accuracy)} m.`,
          );
          resolve(point);
        },
        () => {
          setMessage("Δεν ήταν δυνατός ο εντοπισμός GPS.");
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000,
        },
      );
    });
  }

  async function search() {
    const value = query.trim();
    if (value.length < 2) {
      setMessage("Γράψε τουλάχιστον δύο χαρακτήρες.");
      return;
    }

    setBusy(true);
    setMessage("Αναζητώ σε Pantavion, Κτηματολόγιο και εξωτερικό reference map...");
    try {
      const response = await fetch(
        `/api/professional/infrastructure/water/location/search?q=${encodeURIComponent(value)}`,
        {
          credentials: "include",
          headers: authHeaders(),
        },
      );
      const json = (await response.json()) as SearchResponse;
      if (!response.ok || !json.ok) throw new Error(json.error || "search_failed");
      setResults(json.results || []);
      setMessage(
        (json.results || []).length
          ? `Βρέθηκαν ${(json.results || []).length} σημεία.`
          : "Δεν βρέθηκε σημείο. Μπορείς να πας εκεί με GPS και να το αποθηκεύσεις στο Pantavion.",
      );
    } catch {
      setMessage("Η αναζήτηση δεν ολοκληρώθηκε.");
    } finally {
      setBusy(false);
    }
  }

  async function selectDestination(candidate: Candidate) {
    setDestination(candidate);
    setRoute(null);
    const L = await import("leaflet");
    destinationMarkerRef.current?.remove();
    destinationMarkerRef.current = (L.default || L)
      .circleMarker([candidate.latitude, candidate.longitude], {
        radius: 9,
        weight: 3,
        fillOpacity: 0.9,
      })
      .bindTooltip(candidate.label)
      .addTo(mapRef.current!);
    mapRef.current?.setView([candidate.latitude, candidate.longitude], 18);
    setMessage(`Επιλέχθηκε: ${candidate.label}`);
  }

  async function navigate() {
    if (!destination) {
      setMessage("Επίλεξε πρώτα προορισμό.");
      return;
    }

    const start = currentPosition || (await locate());
    if (!start) return;

    setBusy(true);
    setMessage("Υπολογίζω διαδρομή...");
    try {
      const params = new URLSearchParams({
        startLat: String(start.latitude),
        startLng: String(start.longitude),
        endLat: String(destination.latitude),
        endLng: String(destination.longitude),
      });
      const response = await fetch(
        `/api/professional/infrastructure/water/location/route?${params.toString()}`,
      );
      const json = (await response.json()) as RouteResponse;
      if (!response.ok || !json.ok) throw new Error(json.error || "route_failed");

      const coordinates = json.geometry?.coordinates || [];
      if (!coordinates.length) throw new Error("route_geometry_missing");

      const L = await import("leaflet");
      routeLayerRef.current?.remove();
      const latLngs = coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      routeLayerRef.current = (L.default || L).polyline(latLngs, {
        weight: 6,
        opacity: 0.85,
      }).addTo(mapRef.current!);
      mapRef.current?.fitBounds(routeLayerRef.current.getBounds(), {
        padding: [24, 24],
      });

      setRoute(json);
      setMessage(
        `Διαδρομή: ${metersText(json.distanceMeters)} · ${durationText(json.durationSeconds)}.`,
      );
    } catch {
      setMessage("Δεν μπόρεσα να υπολογίσω διαδρομή αυτή τη στιγμή.");
    } finally {
      setBusy(false);
    }
  }

  async function saveCurrentLocation() {
    const position = currentPosition || (await locate());
    if (!position) return;

    const street = newStreet.trim();
    const placeName = newName.trim();
    if (!street && !placeName) {
      setMessage("Γράψε οδό ή όνομα κτιρίου/σημείου.");
      return;
    }

    const aliasList = aliases
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setBusy(true);
    setMessage("Αποθηκεύω το σημείο ως Pantavion field reference...");
    try {
      const response = await fetch(
        "/api/professional/infrastructure/water/changes/patches",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            clientMutationId: `location-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            mapId: "PANTAVION_CYPRUS_REFERENCE",
            sourceKey: "pantavion-location-registry",
            assetType: "road_reference",
            operation: "create",
            geometry: {
              type: "Point",
              coordinates: [position.longitude, position.latitude],
              crs: { authority: "EPSG", code: "4326" },
            },
            location: {
              source: "gps",
              accuracyState:
                position.accuracy <= 15
                  ? "measured"
                  : position.accuracy <= 50
                    ? "estimated"
                    : "approximate",
              accuracyMeters: position.accuracy,
              streetName: street,
              area: newArea.trim(),
            },
            attributes: {
              name: placeName || [street, newNumber.trim()].filter(Boolean).join(" "),
              buildingName: placeName || undefined,
              houseNumber: newNumber.trim() || undefined,
              aliases: aliasList,
              category: "field_verified_location_reference",
            },
            evidenceRefs: [],
            artifactRefs: [],
            relatedJobIds: [],
            relatedReportIds: [],
          }),
        },
      );

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        patch?: { patch_id?: string };
      };
      if (!response.ok || !json.ok) throw new Error(json.error || "save_failed");

      setMessage(
        "Το σημείο αποθηκεύτηκε στο Pantavion ως pending field reference. Εσύ μπορείς να το ξαναβρείς άμεσα· μετά την έγκριση θα είναι διαθέσιμο στους άλλους εγκεκριμένους χρήστες.",
      );
      setQuery(placeName || [street, newNumber.trim()].filter(Boolean).join(" "));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setMessage(
        message === "access_not_approved"
          ? "Η αποθήκευση νέου σημείου απαιτεί εγκεκριμένη Water συσκευή ή admin session."
          : "Δεν αποθηκεύτηκε το σημείο. Τα υπάρχοντα δεδομένα δεν επηρεάστηκαν.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          Pantavion Location / Navigation
        </p>
        <h1 className="mt-2 text-3xl font-black">Βρες το σημείο · Πήγαινέ με</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Αναζήτηση με οδό, αριθμό, πολυκατοικία, ξενοδοχείο ή άλλο όνομα.
          Προτεραιότητα στα εγκεκριμένα Pantavion field references και στα
          παγκύπρια reference δεδομένα, με εξωτερικό fallback.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void search();
            }}
            placeholder="π.χ. Αμαθούντος 70 ή Arsinoe Hotel"
            className="min-w-0 flex-1 rounded-2xl border border-slate-600 bg-[#07111f] px-4 py-3 text-white outline-none"
          />
          <button
            type="button"
            onClick={() => void search()}
            disabled={busy}
            className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
          >
            Αναζήτηση
          </button>
          <button
            type="button"
            onClick={() => void locate()}
            disabled={busy}
            className="rounded-2xl border border-cyan-400/50 bg-cyan-400/10 px-5 py-3 font-black text-cyan-100 disabled:opacity-60"
          >
            GPS μου
          </button>
        </div>

        <p className="mt-4 rounded-2xl border border-white/10 bg-[#07111f] p-3 text-sm text-slate-200">
          {message}
        </p>

        {results.length ? (
          <div className="mt-4 grid gap-2">
            {results.map((candidate) => (
              <button
                type="button"
                key={candidate.id}
                onClick={() => void selectDestination(candidate)}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
              >
                <span className="block font-black text-white">{candidate.label}</span>
                <span className="mt-1 block text-xs font-bold text-slate-400">
                  {sourceLabel(candidate.source)} · {candidate.confidence}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {destination ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void navigate()}
              disabled={busy}
              className="rounded-2xl bg-emerald-300 px-5 py-3 font-black text-emerald-950 disabled:opacity-60"
            >
              🚗 Πήγαινέ με
            </button>
            <span className="self-center text-sm font-bold text-emerald-100">
              {destination.label}
            </span>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        <div ref={mapEl} className="h-[58vh] min-h-[420px] w-full bg-slate-200" />
      </section>

      {route?.steps?.length ? (
        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <h2 className="text-xl font-black text-emerald-100">
            Οδηγίες · {metersText(route.distanceMeters)} · {durationText(route.durationSeconds)}
          </h2>
          <div className="mt-4 grid gap-2">
            {route.steps.slice(0, 24).map((step, index) => (
              <div
                key={`${index}-${step.maneuverType}-${step.roadName}`}
                className="rounded-2xl border border-emerald-300/10 bg-black/20 p-3 text-sm text-emerald-50"
              >
                <strong>{index + 1}.</strong>{" "}
                {maneuverText(
                  step.maneuverType,
                  step.maneuverModifier,
                  step.roadName,
                )}{" "}
                · {metersText(step.distanceMeters)}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[#f2c766]/25 bg-[#f2c766]/10 p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          Νέα / διορθωμένη τοποθεσία
        </p>
        <h2 className="mt-2 text-2xl font-black">
          Αποθήκευση από το πραγματικό σημείο
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-200">
          Αν μια νέα οδός, κτίριο ή είσοδος δεν υπάρχει ή είναι λάθος,
          πήγαινε στο πραγματικό σημείο, πάτησε GPS και αποθήκευσέ το.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Όνομα κτιρίου / ξενοδοχείου / σημείου"
            className="rounded-2xl border border-slate-600 bg-[#07111f] px-4 py-3 text-white"
          />
          <input
            value={newStreet}
            onChange={(event) => setNewStreet(event.target.value)}
            placeholder="Οδός"
            className="rounded-2xl border border-slate-600 bg-[#07111f] px-4 py-3 text-white"
          />
          <input
            value={newNumber}
            onChange={(event) => setNewNumber(event.target.value)}
            placeholder="Αριθμός"
            className="rounded-2xl border border-slate-600 bg-[#07111f] px-4 py-3 text-white"
          />
          <input
            value={newArea}
            onChange={(event) => setNewArea(event.target.value)}
            placeholder="Περιοχή"
            className="rounded-2xl border border-slate-600 bg-[#07111f] px-4 py-3 text-white"
          />
          <input
            value={aliases}
            onChange={(event) => setAliases(event.target.value)}
            placeholder="Άλλα ονόματα / παλιά ονομασία, με κόμμα"
            className="rounded-2xl border border-slate-600 bg-[#07111f] px-4 py-3 text-white sm:col-span-2"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void locate()}
            disabled={busy}
            className="rounded-2xl border border-[#f2c766]/50 px-5 py-3 font-black text-[#f2c766]"
          >
            📍 Πάρε ακριβές GPS
          </button>
          <button
            type="button"
            onClick={() => void saveCurrentLocation()}
            disabled={busy}
            className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
          >
            ➕ Αποθήκευση στο Pantavion
          </button>
        </div>
      </section>
    </div>
  );
}
