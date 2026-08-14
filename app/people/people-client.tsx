"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; username: string | null; display_name: string | null; avatar_url: string | null; bio: string | null; country: string | null; language: string | null };
type Relationship = { id: string; requester_id: string; addressee_id: string; status: string; created_at: string; updated_at: string };
type NearbyPerson = { user_id: string; display_name: string | null; avatar_url: string | null; country_code: string | null; region: string | null; city: string | null; distance_bucket: string };

export default function PeopleClient({ currentUserId, profiles, relationships: initialRelationships, backendReady, backendMessage }: { currentUserId: string; profiles: Profile[]; relationships: Relationship[]; backendReady: boolean; backendMessage: string | null }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [relationships, setRelationships] = useState(initialRelationships);
  const [nearby, setNearby] = useState<NearbyPerson[]>([]);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const relationByUser = useMemo(() => {
    const map = new Map<string, Relationship>();
    relationships.forEach((r) => map.set(r.requester_id === currentUserId ? r.addressee_id : r.requester_id, r));
    return map;
  }, [relationships, currentUserId]);

  async function refreshRelationships() {
    const response = await fetch("/api/people/relationships", { cache: "no-store" });
    const json = await response.json();
    if (response.ok && json.relationships) setRelationships(json.relationships);
  }

  async function requestConnection(userId: string) {
    setBusy(userId); setNotice(null);
    const response = await fetch("/api/people/relationships", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ addresseeId: userId }) });
    const json = await response.json();
    setBusy(null);
    if (!response.ok) return setNotice(json.detail || json.error || "Η αίτηση απέτυχε.");
    await refreshRelationships();
  }

  async function respond(relationshipId: string, action: "accept" | "decline") {
    setBusy(relationshipId); setNotice(null);
    const response = await fetch("/api/people/relationships", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ relationshipId, action }) });
    const json = await response.json();
    setBusy(null);
    if (!response.ok) return setNotice(json.detail || json.error || "Η ενέργεια απέτυχε.");
    await refreshRelationships();
  }

  async function openConversation(otherUserId: string) {
    setBusy(otherUserId); setNotice(null);
    const response = await fetch("/api/messages/conversations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ otherUserId }) });
    const json = await response.json();
    setBusy(null);
    if (!response.ok) return setNotice(json.detail || json.error || "Δεν άνοιξε η συνομιλία.");
    router.push(`/messages/${json.conversationId}`);
  }

  async function findNearby() {
    setNotice(null);
    if (!navigator.geolocation) return setNotice("Η συσκευή δεν υποστηρίζει γεωεντοπισμό.");
    setBusy("nearby");
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const { error: presenceError } = await supabase.rpc("pantavion_update_location_presence", {
        p_latitude: latitude,
        p_longitude: longitude,
        p_accuracy_meters: accuracy,
        p_nearby_enabled: true,
        p_expires_minutes: 30,
      });
      if (presenceError) {
        setBusy(null);
        return setNotice(presenceError.message);
      }
      const { data, error } = await supabase.rpc("pantavion_find_nearby_people", { p_radius_meters: 25000, p_limit: 50 });
      setBusy(null);
      if (error) return setNotice(error.message);
      setNearby((data ?? []) as NearbyPerson[]);
      setNearbyEnabled(true);
      setNotice(data?.length ? `Βρέθηκαν ${data.length} άτομα στην επιλεγμένη ακτίνα.` : "Δεν βρέθηκαν ακόμη διαθέσιμα άτομα κοντά σου.");
    }, (error) => {
      setBusy(null);
      setNotice(error.message || "Δεν δόθηκε πρόσβαση στην τοποθεσία.");
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  async function disableNearby() {
    setBusy("nearby"); setNotice(null);
    const { error } = await supabase.rpc("pantavion_disable_location_presence");
    setBusy(null);
    if (error) return setNotice(error.message);
    setNearby([]); setNearbyEnabled(false);
    setNotice("Η παρουσία Nearby απενεργοποιήθηκε.");
  }

  return (
    <main className="min-h-screen bg-[#f5f9fd] text-slate-950">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:px-12">
        <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><Link href="/" className="font-black tracking-[0.18em] text-[#173f72] no-underline">PANTAVION</Link><div className="flex gap-2"><Link href="/ecosystem" className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 no-underline">Ecosystem</Link><Link href="/profile" className="rounded-full bg-[#2467aa] px-3 py-2 text-xs font-black text-white no-underline">Profile</Link></div></nav>

        <header className="py-9"><p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#3474b8]">PEOPLE & SOCIAL</p><h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#173f72] sm:text-5xl">Άνθρωποι, αιτήματα, πραγματικές σχέσεις.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Η πρώτη ζωντανή ανθρώπινη διαδρομή του Pantavion: profile → request → accept → conversation → message.</p></header>

        {!backendReady && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><strong>Backend migration pending.</strong> Η People επιφάνεια είναι έτοιμη, αλλά η production Supabase δεν έχει ακόμη επιβεβαιωθεί ότι περιέχει τα νέα relationship/message tables.{backendMessage ? <span className="mt-1 block text-xs opacity-70">{backendMessage}</span> : null}</div>}
        {notice && <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">{notice}</div>}

        <section className="mb-6 rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#3474b8]">NEARBY PEOPLE</p><h2 className="mt-1 text-xl font-black text-[#173f72]">Άτομα κοντά σου, χωρίς αποκάλυψη ακριβούς θέσης.</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Η θέση λήγει αυτόματα και στους άλλους εμφανίζεται μόνο προσεγγιστική απόσταση, όχι latitude/longitude.</p></div>
            <div className="flex gap-2"><button disabled={busy === "nearby"} onClick={findNearby} className="rounded-full bg-[#2467aa] px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">{busy === "nearby" ? "Εντοπισμός…" : "Βρες κοντινά άτομα"}</button>{nearbyEnabled && <button disabled={busy === "nearby"} onClick={disableNearby} className="rounded-full border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600">Κλείσιμο Nearby</button>}</div>
          </div>
          {nearby.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{nearby.map((person) => <article key={person.user_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-black text-slate-900">{person.display_name || "Pantavion User"}</p><p className="mt-1 text-xs text-slate-500">{[person.city, person.region, person.country_code].filter(Boolean).join(" · ")}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#2467aa]">{person.distance_bucket}</span></div></article>)}</div>}
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const relation = relationByUser.get(profile.id);
            const incoming = relation?.status === "pending" && relation.addressee_id === currentUserId;
            const outgoing = relation?.status === "pending" && relation.requester_id === currentUserId;
            const connected = relation?.status === "accepted";
            return (
              <article key={profile.id} className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">{(profile.display_name || profile.username || "P").slice(0, 1).toUpperCase()}</div><div><h2 className="font-black text-slate-900">{profile.display_name || profile.username || "Pantavion User"}</h2><p className="text-xs text-slate-500">{[profile.country, profile.language].filter(Boolean).join(" · ") || "Pantavion"}</p></div></div>
                {profile.bio && <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{profile.bio}</p>}
                <div className="mt-4">
                  {!relation || ["declined", "removed"].includes(relation.status) ? <button disabled={!backendReady || busy === profile.id} onClick={() => requestConnection(profile.id)} className="w-full rounded-full bg-[#2467aa] px-4 py-2.5 text-sm font-black text-white disabled:opacity-40">{busy === profile.id ? "..." : "Αίτημα σύνδεσης"}</button> : null}
                  {outgoing ? <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-black text-amber-700">Αναμονή αποδοχής</div> : null}
                  {incoming ? <div className="flex gap-2"><button disabled={busy === relation.id} onClick={() => respond(relation.id, "accept")} className="flex-1 rounded-full bg-emerald-600 px-3 py-2.5 text-xs font-black text-white">Αποδοχή</button><button disabled={busy === relation.id} onClick={() => respond(relation.id, "decline")} className="rounded-full border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600">Όχι</button></div> : null}
                  {connected ? <button disabled={busy === profile.id} onClick={() => openConversation(profile.id)} className="w-full rounded-full bg-[#123b67] px-4 py-2.5 text-sm font-black text-white">{busy === profile.id ? "Άνοιγμα..." : "Μήνυμα"}</button> : null}
                </div>
              </article>
            );
          })}
        </div>
        {!profiles.length && <div className="rounded-[1.35rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">Δεν υπάρχουν ακόμη ορατά profiles για αυτόν τον λογαριασμό.</div>}
      </section>
    </main>
  );
}
