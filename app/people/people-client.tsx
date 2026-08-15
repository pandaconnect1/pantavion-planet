"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; username: string | null; display_name: string | null; avatar_url: string | null; bio: string | null; country: string | null; language: string | null };
type Relationship = { id: string; requester_id: string; addressee_id: string; status: string; created_at: string; updated_at: string };
type NearbyPerson = { user_id: string; display_name: string | null; avatar_url: string | null; country_code: string | null; region: string | null; city: string | null; distance_bucket: string };
type Block = { blocked_id: string; created_at?: string };

export default function PeopleClient({ currentUserId, profiles, relationships: initialRelationships, backendReady, backendMessage }: { currentUserId: string; profiles: Profile[]; relationships: Relationship[]; backendReady: boolean; backendMessage: string | null }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [relationships, setRelationships] = useState(initialRelationships);
  const [nearby, setNearby] = useState<NearbyPerson[]>([]);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blocksLoaded, setBlocksLoaded] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  const relationByUser = useMemo(() => {
    const map = new Map<string, Relationship>();
    relationships.forEach((relationship) => map.set(relationship.requester_id === currentUserId ? relationship.addressee_id : relationship.requester_id, relationship));
    return map;
  }, [relationships, currentUserId]);

  const blockedIds = useMemo(() => new Set(blocks.map((block) => block.blocked_id)), [blocks]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleProfiles = useMemo(() => profiles.filter((profile) => {
    if (blockedIds.has(profile.id)) return false;
    if (!normalizedQuery) return true;
    return [profile.display_name, profile.username, profile.country, profile.language, profile.bio]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  }), [profiles, blockedIds, normalizedQuery]);
  const blockedProfiles = useMemo(() => profiles.filter((profile) => blockedIds.has(profile.id)), [profiles, blockedIds]);

  async function loadBlocks(force = false) {
    if (blocksLoaded && !force) return;
    const response = await fetch("/api/people/blocks", { cache: "no-store" });
    const json = await response.json().catch(() => ({}));
    if (response.ok) {
      setBlocks(json.blocks ?? []);
      setBlocksLoaded(true);
    }
  }

  async function refreshRelationships() {
    const response = await fetch("/api/people/relationships", { cache: "no-store" });
    const json = await response.json().catch(() => ({}));
    if (response.ok && json.relationships) setRelationships(json.relationships);
  }

  async function requestConnection(userId: string) {
    setBusy(userId); setNotice(null);
    const response = await fetch("/api/people/relationships", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ addresseeId: userId }) });
    const json = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) return setNotice(json.detail || json.error || "Η αίτηση απέτυχε.");
    await refreshRelationships();
  }

  async function respond(relationshipId: string, action: "accept" | "decline") {
    setBusy(relationshipId); setNotice(null);
    const response = await fetch("/api/people/relationships", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ relationshipId, action }) });
    const json = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) return setNotice(json.detail || json.error || "Η ενέργεια απέτυχε.");
    await refreshRelationships();
  }

  async function blockUser(userId: string) {
    setBusy(`block:${userId}`); setNotice(null);
    const response = await fetch("/api/people/blocks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ blockedId: userId }) });
    const json = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) return setNotice(json.detail || json.error || "Το μπλοκάρισμα απέτυχε.");
    await loadBlocks(true);
    setNotice("Ο χρήστης μπλοκαρίστηκε. Δεν μπορεί να ξεκινήσει νέα επικοινωνία μαζί σου.");
  }

  async function unblockUser(userId: string) {
    setBusy(`unblock:${userId}`); setNotice(null);
    const response = await fetch("/api/people/blocks", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ blockedId: userId }) });
    const json = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) return setNotice(json.detail || json.error || "Η άρση μπλοκαρίσματος απέτυχε.");
    await loadBlocks(true);
    setNotice("Το μπλοκάρισμα αφαιρέθηκε.");
  }

  async function openConversation(otherUserId: string) {
    setBusy(otherUserId); setNotice(null);
    const response = await fetch("/api/messages/conversations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ otherUserId }) });
    const json = await response.json().catch(() => ({}));
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
      const { error: presenceError } = await supabase.rpc("pantavion_update_location_presence", { p_latitude: latitude, p_longitude: longitude, p_accuracy_meters: accuracy, p_nearby_enabled: true, p_expires_minutes: 30 });
      if (presenceError) { setBusy(null); return setNotice(presenceError.message); }
      const { data, error } = await supabase.rpc("pantavion_find_nearby_people", { p_radius_meters: 25000, p_limit: 50 });
      setBusy(null);
      if (error) return setNotice(error.message);
      setNearby((data ?? []) as NearbyPerson[]); setNearbyEnabled(true);
      setNotice(data?.length ? `Βρέθηκαν ${data.length} άτομα στην επιλεγμένη ακτίνα.` : "Δεν βρέθηκαν ακόμη διαθέσιμα άτομα κοντά σου.");
    }, (error) => { setBusy(null); setNotice(error.message || "Δεν δόθηκε πρόσβαση στην τοποθεσία."); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  async function disableNearby() {
    setBusy("nearby"); setNotice(null);
    const { error } = await supabase.rpc("pantavion_disable_location_presence");
    setBusy(null);
    if (error) return setNotice(error.message);
    setNearby([]); setNearbyEnabled(false); setNotice("Η παρουσία Nearby απενεργοποιήθηκε.");
  }

  void loadBlocks();

  return (
    <main className="min-h-screen bg-[#f5f9fd] text-slate-950">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:px-12">
        <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><Link href="/" className="font-black tracking-[0.18em] text-[#173f72] no-underline">PANTAVION</Link><div className="flex gap-2"><Link href="/social" className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 no-underline">Social</Link><Link href="/profile" className="rounded-full bg-[#2467aa] px-3 py-2 text-xs font-black text-white no-underline">Profile</Link></div></nav>

        <header className="py-8"><p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#3474b8]">PEOPLE</p><h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#173f72] sm:text-5xl">Βρες, σύνδεσε, μίλησε.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Profile → request → accept → realtime conversation. Με αναζήτηση, Nearby και block controls.</p></header>

        {!backendReady && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><strong>Backend unavailable.</strong>{backendMessage ? <span className="mt-1 block text-xs opacity-70">{backendMessage}</span> : null}</div>}
        {notice && <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">{notice}</div>}

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Αναζήτηση ονόματος, χώρας, γλώσσας…" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2467aa]" />
            <button type="button" onClick={() => { setShowBlocked((value) => !value); void loadBlocks(); }} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600">Μπλοκαρισμένοι · {blocks.length}</button>
          </div>
          {showBlocked ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{blockedProfiles.length ? blockedProfiles.map((profile) => <div key={profile.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><span className="text-sm font-bold">{profile.display_name || profile.username || "Pantavion User"}</span><button disabled={busy === `unblock:${profile.id}`} onClick={() => void unblockUser(profile.id)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black">Άρση block</button></div>) : <p className="text-sm text-slate-500">Δεν υπάρχουν μπλοκαρισμένα ορατά profiles.</p>}</div> : null}
        </section>

        <section className="mb-6 rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#3474b8]">NEARBY PEOPLE</p><h2 className="mt-1 text-xl font-black text-[#173f72]">Άτομα κοντά σου χωρίς ακριβή θέση.</h2></div><div className="flex gap-2"><button disabled={busy === "nearby"} onClick={findNearby} className="rounded-full bg-[#2467aa] px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">{busy === "nearby" ? "Εντοπισμός…" : "Βρες κοντινά άτομα"}</button>{nearbyEnabled && <button disabled={busy === "nearby"} onClick={disableNearby} className="rounded-full border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600">Κλείσιμο Nearby</button>}</div></div>
          {nearby.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{nearby.filter((person) => !blockedIds.has(person.user_id)).map((person) => <article key={person.user_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="font-black">{person.display_name || "Pantavion User"}</p><p className="mt-1 text-xs text-slate-500">{[person.city, person.region, person.country_code, person.distance_bucket].filter(Boolean).join(" · ")}</p></article>)}</div>}
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProfiles.map((profile) => {
            const relation = relationByUser.get(profile.id);
            const incoming = relation?.status === "pending" && relation.addressee_id === currentUserId;
            const outgoing = relation?.status === "pending" && relation.requester_id === currentUserId;
            const connected = relation?.status === "accepted";
            return <article key={profile.id} className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">{(profile.display_name || profile.username || "P").slice(0, 1).toUpperCase()}</div><div><h2 className="font-black">{profile.display_name || profile.username || "Pantavion User"}</h2><p className="text-xs text-slate-500">{[profile.country, profile.language].filter(Boolean).join(" · ") || "Pantavion"}</p></div></div>
              {profile.bio && <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{profile.bio}</p>}
              <div className="mt-4 space-y-2">
                {!relation || ["declined", "removed"].includes(relation.status) ? <button disabled={!backendReady || busy === profile.id} onClick={() => void requestConnection(profile.id)} className="w-full rounded-full bg-[#2467aa] px-4 py-2.5 text-sm font-black text-white disabled:opacity-40">Αίτημα σύνδεσης</button> : null}
                {outgoing ? <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-black text-amber-700">Αναμονή αποδοχής</div> : null}
                {incoming ? <div className="flex gap-2"><button disabled={busy === relation.id} onClick={() => void respond(relation.id, "accept")} className="flex-1 rounded-full bg-emerald-600 px-3 py-2.5 text-xs font-black text-white">Αποδοχή</button><button disabled={busy === relation.id} onClick={() => void respond(relation.id, "decline")} className="rounded-full border border-slate-200 px-3 py-2.5 text-xs font-black">Όχι</button></div> : null}
                {connected ? <button disabled={busy === profile.id} onClick={() => void openConversation(profile.id)} className="w-full rounded-full bg-[#123b67] px-4 py-2.5 text-sm font-black text-white">Μήνυμα</button> : null}
                <button disabled={busy === `block:${profile.id}`} onClick={() => void blockUser(profile.id)} className="w-full rounded-full border border-red-200 px-4 py-2 text-xs font-black text-red-700 disabled:opacity-40">Block</button>
              </div>
            </article>;
          })}
        </div>
        {!visibleProfiles.length && <div className="rounded-[1.35rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">Δεν βρέθηκαν ορατά profiles με αυτά τα κριτήρια.</div>}
      </section>
    </main>
  );
}
