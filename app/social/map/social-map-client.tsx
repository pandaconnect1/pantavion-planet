"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Share = {
  enabled: boolean;
  audience: "connections" | "selected" | "nobody";
  precision_mode: "precise" | "approximate";
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
  expires_at: string | null;
  updated_at: string;
};

type Connection = { id: string; display_name: string | null; username: string | null; avatar_url: string | null };
type VisibleLocation = Connection & {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  precision_mode: "precise" | "approximate";
  updated_at: string;
  expires_at: string | null;
};

const nearbyCategories = [
  ["restaurant", "Φαγητό"],
  ["fuel", "Βενζίνη"],
  ["pharmacy", "Φαρμακείο"],
  ["hospital", "Νοσοκομείο"],
  ["atm", "ATM"],
  ["cafe", "Καφέ"],
  ["hotel", "Ξενοδοχείο"],
  ["car_repair", "Συνεργείο"],
] as const;

export default function SocialMapClient({ userId, initialShare, connections }: { userId: string; initialShare: Share | null; connections: Connection[] }) {
  const supabase = useMemo(() => createClient(), []);
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [visible, setVisible] = useState<VisibleLocation[]>([]);
  const [enabled, setEnabled] = useState(initialShare?.enabled ?? false);
  const [audience, setAudience] = useState<"connections" | "selected">(initialShare?.audience === "selected" ? "selected" : "connections");
  const [precision, setPrecision] = useState<"precise" | "approximate">(initialShare?.precision_mode ?? "approximate");
  const [expiresHours, setExpiresHours] = useState(8);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [myPoint, setMyPoint] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(initialShare?.latitude != null && initialShare.longitude != null ? { latitude: initialShare.latitude, longitude: initialShare.longitude, accuracy: initialShare.accuracy_meters } : null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function refreshVisible() {
    const { data, error } = await supabase.rpc("pantavion_visible_social_locations");
    if (!error && data) setVisible(data as VisibleLocation[]);
  }

  useEffect(() => { void refreshVisible(); }, []);

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      if (!mapElement.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapElement.current) return;
      const map = L.map(mapElement.current, { zoomControl: true }).setView([34.68, 33.04], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
    }
    void setup();
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; layerRef.current = null; } };
  }, []);

  useEffect(() => {
    async function redraw() {
      if (!mapRef.current || !layerRef.current) return;
      const L = await import("leaflet");
      layerRef.current.clearLayers();
      const points: [number, number][] = [];
      if (myPoint) {
        L.circleMarker([myPoint.latitude, myPoint.longitude], { radius: 8 }).bindPopup("Εσύ").addTo(layerRef.current);
        points.push([myPoint.latitude, myPoint.longitude]);
      }
      visible.forEach((item) => {
        const label = item.display_name || item.username || "Φίλος";
        const marker = L.circleMarker([item.latitude, item.longitude], { radius: 8 }).bindPopup(`${label}<br/>${item.precision_mode === "approximate" ? "Περίπου" : "Ακριβής θέση"}<br/>${new Date(item.updated_at).toLocaleString()}`);
        marker.addTo(layerRef.current);
        points.push([item.latitude, item.longitude]);
      });
      if (points.length === 1) mapRef.current.setView(points[0], 14);
      else if (points.length > 1) mapRef.current.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    }
    void redraw();
  }, [visible, myPoint]);

  async function setSelectedMembers(ids: string[]) {
    const { error: deleteError } = await supabase.from("social_location_share_members").delete().eq("owner_id", userId);
    if (deleteError) throw deleteError;
    if (ids.length) {
      const { error } = await supabase.from("social_location_share_members").insert(ids.map((viewerId) => ({ owner_id: userId, viewer_id: viewerId })));
      if (error) throw error;
    }
  }

  async function shareMyLocation() {
    if (!navigator.geolocation) return setNotice("Η συσκευή δεν υποστηρίζει εντοπισμό θέσης.");
    setBusy(true); setNotice("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null };
      const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();
      try {
        if (audience === "selected") await setSelectedMembers(selectedIds);
        const { error } = await supabase.from("social_location_shares").upsert({
          user_id: userId,
          enabled: true,
          audience,
          precision_mode: precision,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy_meters: point.accuracy,
          shared_at: new Date().toISOString(),
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        setEnabled(true); setMyPoint(point); setNotice("Η θέση σου κοινοποιείται μόνο στο κοινό που επέλεξες.");
        await refreshVisible();
      } catch (error: any) {
        setNotice(error?.message || "Δεν μπόρεσε να ενεργοποιηθεί η κοινοποίηση θέσης.");
      } finally { setBusy(false); }
    }, (error) => { setBusy(false); setNotice(error.message || "Δεν δόθηκε πρόσβαση στην τοποθεσία."); }, { enableHighAccuracy: precision === "precise", timeout: 12000, maximumAge: 15000 });
  }

  async function stopSharing() {
    setBusy(true); setNotice("");
    const { error } = await supabase.from("social_location_shares").upsert({ user_id: userId, enabled: false, audience: "nobody", updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return setNotice(error.message);
    setEnabled(false); setNotice("Η κοινοποίηση θέσης σταμάτησε.");
  }

  function navigateTo(item: VisibleLocation) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${item.latitude},${item.longitude}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function findNearby(query: string) {
    if (!myPoint) return setNotice("Ενεργοποίησε πρώτα την τοποθεσία σου για να βρούμε τι υπάρχει κοντά σου.");
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&center=${myPoint.latitude},${myPoint.longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
    <aside className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-black text-[#173f72]">Η θέση μου</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">Εσύ αποφασίζεις αν, σε ποιους και για πόσο θα φαίνεται η θέση σου.</p>
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-black text-slate-600">Ποιοι μπορούν να τη δουν</label>
          <select value={audience} onChange={(e) => setAudience(e.target.value as any)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="connections">Όλοι οι φίλοι μου</option><option value="selected">Μόνο φίλοι που επιλέγω</option></select>
          {audience === "selected" && <div className="max-h-44 space-y-2 overflow-auto rounded-xl bg-slate-50 p-2">{connections.map((c) => <label key={c.id} className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm"><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={(e) => setSelectedIds((ids) => e.target.checked ? [...ids, c.id] : ids.filter((id) => id !== c.id))} /><span>{c.display_name || c.username || "Φίλος"}</span></label>)}{!connections.length && <p className="p-2 text-xs text-slate-500">Δεν υπάρχουν ακόμη συνδεδεμένοι φίλοι.</p>}</div>}
          <label className="block text-xs font-black text-slate-600">Ακρίβεια</label>
          <select value={precision} onChange={(e) => setPrecision(e.target.value as any)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="approximate">Περίπου</option><option value="precise">Ακριβής θέση</option></select>
          <label className="block text-xs font-black text-slate-600">Διάρκεια</label>
          <select value={expiresHours} onChange={(e) => setExpiresHours(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value={1}>1 ώρα</option><option value={8}>8 ώρες</option><option value={24}>24 ώρες</option></select>
          <button onClick={shareMyLocation} disabled={busy || (audience === "selected" && !selectedIds.length)} className="w-full rounded-full bg-[#2467aa] px-4 py-3 text-sm font-black text-white disabled:opacity-40">{busy ? "Ενημέρωση…" : enabled ? "Ενημέρωση θέσης" : "Κοινοποίηση θέσης"}</button>
          {enabled && <button onClick={stopSharing} disabled={busy} className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm font-black text-slate-600">Σταμάτημα κοινοποίησης</button>}
        </div>
        {notice && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">{notice}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-black text-[#173f72]">Κοντά μου</h2>
        <div className="mt-3 flex flex-wrap gap-2">{nearbyCategories.map(([query, label]) => <button key={query} onClick={() => findNearby(query)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">{label}</button>)}</div>
        <p className="mt-3 text-xs leading-5 text-slate-500">Η αναζήτηση κοντινών σημείων ανοίγει προσωρινά στον εξωτερικό χάρτη. Το Pantavion-native Places provider παραμένει ανοιχτή εκκρεμότητα μέχρι να συνδεθεί πραγματική πηγή POI.</p>
      </section>
    </aside>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div ref={mapElement} className="h-[60vh] min-h-[440px] w-full" />
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center justify-between"><h2 className="font-black text-[#173f72]">Φίλοι που μοιράζονται θέση μαζί σου</h2><button onClick={refreshVisible} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Ανανέωση</button></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{visible.map((item) => <article key={item.user_id} className="rounded-xl bg-slate-50 p-3"><div className="font-black">{item.display_name || item.username || "Φίλος"}</div><div className="mt-1 text-xs text-slate-500">{item.precision_mode === "approximate" ? "Περίπου" : "Ακριβής θέση"} · ενημέρωση {new Date(item.updated_at).toLocaleTimeString()}</div><button onClick={() => navigateTo(item)} className="mt-3 rounded-full bg-[#123b67] px-3 py-2 text-xs font-black text-white">Πήγαινέ με εκεί</button></article>)}{!visible.length && <p className="text-sm text-slate-500">Κανένας φίλος δεν μοιράζεται αυτή τη στιγμή θέση μαζί σου.</p>}</div>
      </div>
    </section>
  </div>;
}
