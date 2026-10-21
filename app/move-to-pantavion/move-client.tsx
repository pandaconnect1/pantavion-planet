"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { ImportedEntry, ImportProvider, previewUserExport } from "@/core/pantavion/user-owned-message-export";

type Stored = {
  id:string;source_provider:string;record_kind:string;
  original_sender:string|null;original_subject:string|null;original_text:string;
  sent_at:string|null;imported_at:string;
};
type Preview={provider:ImportProvider;filename:string;records:ImportedEntry[]};

export default function MoveToPantavionClient({
  initialRecords,ready,
}: { initialRecords:Stored[];ready:boolean }) {
  const [entries,setEntries]=useState<Stored[]>(initialRecords);
  const [preview,setPreview]=useState<Preview|null>(null);
  const [consent,setConsent]=useState(false);
  const [notice,setNotice]=useState(ready?"":"Το ιδιωτικό αρχείο δεν είναι ακόμη διαθέσιμο στην παραγωγή.");
  const [busy,setBusy]=useState(false);
  const [search,setSearch]=useState("");
  const [verifyDeletion,setVerifyDeletion]=useState(false);
  const visible=useMemo(()=>entries.filter(e=>{
    const q=search.trim().toLowerCase();
    return !q||[e.original_sender,e.original_subject,e.original_text,e.source_provider].some(v=>v?.toLowerCase().includes(q));
  }),[entries,search]);

  async function chooseFile(event:ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0];event.target.value="";
    setConsent(false);setPreview(null);setNotice("");
    if(!file)return;
    if(file.size>500_000||file.size<1) {
      setNotice("Επιτρέπεται αρχείο από 1 byte έως 500 KB.");return;
    }
    try {
      // Only read the local file. Nothing transmitted at this stage.
      const result=previewUserExport(file.name,await file.text());
      setPreview({filename:file.name,provider:result.provider,records:result.records});
      setNotice(`Έτοιμη προεπισκόπηση ${result.records.length} εγγραφών. Καμία μεταφορά δεν έγινε.`);
    } catch(e) {
      setNotice(e instanceof Error?e.message:"Το αρχείο δεν αναγνωρίστηκε.");
    }
  }
  async function reload() {
    // Keep this page fully user-authenticated; no public search.
    window.location.reload();
  }
  async function importSelected() {
    if(!preview||!consent||busy||!ready)return;
    setBusy(true);setNotice("");
    try {
      const response=await fetch("/api/pantavion/import-archive",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          action:"import",
          confirmed:true,
          filename:preview.filename,
          provider:preview.provider,
          records:preview.records,
        }),
      });
      const answer=await response.json().catch(()=>({}));
      if(response.ok&&answer.ok===true) {
        setPreview(null);setConsent(false);
        setNotice(`Αποθηκεύτηκαν ${answer.importedCount} νέες ιδιωτικές εγγραφές. Τα διπλότυπα παραλείφθηκαν.`);
        await reload();
      }else setNotice("Η εισαγωγή δεν ολοκληρώθηκε. Δεν εμφανίζουμε ιδιωτικά στοιχεία στα σφάλματα.");
    }catch {
      setNotice("Η σύνδεση δεν ήταν διαθέσιμη. Δεν επιβεβαιώθηκε εισαγωγή.");
    }finally {setBusy(false);}
  }
  async function revoke() {
    if(busy)return;
    setBusy(true);
    try {
      const response=await fetch("/api/pantavion/import-archive",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"revoke"}),
      });
      setNotice(response.ok?
        "Η συναίνεση για νέες εισαγωγές ανακλήθηκε. Τα ήδη αποθηκευμένα μηνύματα δεν διαγράφηκαν."
        :"Δεν επιβεβαιώθηκε η ανάκληση.");
      setPreview(null);setConsent(false);
    }catch {setNotice("Δεν επιβεβαιώθηκε η ανάκληση.");}
    finally {setBusy(false);}
  }
  async function deleteOwnArchive(){
    if(!verifyDeletion||busy)return;
    setBusy(true);
    try{
      const response=await fetch("/api/pantavion/import-archive",{
        method:"DELETE",headers:{"content-type":"application/json"},
        body:'{"deleteAllImportedCommunications":true}',
      });
      if(response.ok){
        setEntries([]);setVerifyDeletion(false);
        setNotice("Διαγράφηκαν οι ιδιωτικές εισαγμένες εγγραφές επικοινωνίας σου.");
      } else setNotice("Η διαγραφή δεν ολοκληρώθηκε.");
    }catch {setNotice("Η διαγραφή δεν επιβεβαιώθηκε.");}
    finally {setBusy(false);}
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr]">
      <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-[#173f72]">Επιλογή πηγής από τη συσκευή σου</h2>
        <p className="text-sm leading-6 text-slate-600">
          Από κινητό, PC ή tablet: άνοιξε το αρχείο που εξήγαγες εσύ από την αρχική
          υπηρεσία. Υποστηρίζονται σε αυτή τη φάση μόνο απλό email (.eml, .mbox)
          και εξαγόμενη συνομιλία απλού κειμένου (.txt).
        </p>
        <label className="block text-sm font-bold text-slate-700">
          Επίλεξε αρχείο
          <input type="file" accept=".eml,.mbox,.txt,text/plain,message/rfc822"
            disabled={!ready||busy}
            onChange={chooseFile}
            className="mt-2 block w-full text-xs" />
        </label>
        <p className="text-xs leading-5 text-amber-800">
          Δεν ανοίγουμε λογαριασμό WhatsApp, Gmail, Signal, Instagram ή άλλης υπηρεσίας
          χωρίς επίσημη σύνδεση. Δεν υποστηρίζονται ακόμη συνημμένα, κρυπτογραφημένα
          αντίγραφα, αυτόματος συγχρονισμός ή απεριόριστα αρχεία.
        </p>

        {preview&&(
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h3 className="font-black text-[#173f72]">Προεπισκόπηση · {preview.records.length} εγγραφές</h3>
            {preview.provider==="chat_text_export"&&(
              <label className="mt-3 block text-sm">
                Προέλευση αρχείου κειμένου
                <select value={preview.provider}
                  onChange={e=>setPreview({...preview,provider:e.target.value as ImportProvider})}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2">
                  <option value="chat_text_export">Άλλη δική μου εξαγωγή συνομιλίας</option>
                  <option value="whatsapp_export">Επίσημη εξαγωγή WhatsApp</option>
                </select>
              </label>
            )}
            {preview.provider==="whatsapp_export"&&(
              <button type="button" className="mt-2 text-xs underline"
                onClick={()=>setPreview({...preview,provider:"chat_text_export"})}>
                Δεν είναι WhatsApp — διόρθωση προέλευσης
              </button>
            )}
            <div className="mt-3 max-h-48 overflow-y-auto">
              {preview.records.slice(0,8).map((e,i)=>(
                <p key={i} className="mb-2 border-b border-slate-200 py-1 text-xs">
                  <strong>{e.sender||e.subject||"Μήνυμα"}</strong> — {e.text.slice(0,110)}
                </p>
              ))}
              {preview.records.length>8&&<p className="text-xs">Και {preview.records.length-8} ακόμη…</p>}
            </div>
            <label className="mt-3 flex items-start gap-2 text-xs leading-5">
              <input type="checkbox" checked={consent}
                onChange={e=>setConsent(e.target.checked)} className="mt-1"/>
              <span>Επιλέγω εγώ να αποθηκεύσω αυτές τις εγγραφές ιδιωτικά στο Pantavion.
                Κατανοώ ότι μπορεί να περιέχουν στοιχεία άλλων ανθρώπων· δεν θα δημοσιευτούν
                ούτε θα αποσταλούν αυτόματα ως νέα μηνύματα.</span>
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={!consent||busy} onClick={importSelected}
                className="rounded-full bg-[#2467aa] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
                Επιβεβαίωση και εισαγωγή
              </button>
              <button type="button" onClick={()=>{setPreview(null);setConsent(false);}}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs">Ακύρωση</button>
            </div>
          </section>
        )}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="font-black">Η δική σου επιλογή</h3>
          <button type="button" onClick={revoke} disabled={busy}
            className="mt-3 text-xs font-semibold text-[#173f72] underline">
            Ανάκληση συναίνεσης για νέες εισαγωγές
          </button>
          <label className="mt-4 flex gap-2 text-xs">
            <input type="checkbox" checked={verifyDeletion}
              onChange={e=>setVerifyDeletion(e.target.checked)}/>
            Θέλω να διαγράψω όλες τις εισαγμένες επικοινωνίες μου.
          </label>
          <button type="button" onClick={deleteOwnArchive} disabled={!verifyDeletion||busy}
            className="mt-2 rounded-full border border-red-500 px-4 py-2 text-xs font-bold text-red-700 disabled:opacity-40">
            Οριστική διαγραφή ιδιωτικού αρχείου
          </button>
        </div>
        {notice&&<p role="status" className="rounded-xl bg-slate-100 p-3 text-xs font-semibold">{notice}</p>}
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-[#173f72]">Τα εισαγμένα προσωπικά μηνύματα και email</h2>
        <p className="mt-2 text-xs text-slate-600">
          Ιδιωτικό αρχείο ιστορικού, όχι νέα συνομιλία Pantavion και όχι ζωντανή σύνδεση εξωτερικής υπηρεσίας.
          Εμφανίζονται οι 300 πιο πρόσφατες εγγραφές.
        </p>
        <input placeholder="Αναζήτηση στις δικές μου εισαγωγές" value={search}
          onChange={e=>setSearch(e.target.value)}
          className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"/>
        <div className="mt-4 space-y-3">
          {visible.map(entry=>(
            <article key={entry.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span>{entry.record_kind==="email"?"Email":"Ιστορικό συνομιλίας"} · {entry.source_provider}</span>
                <span>{new Date(entry.imported_at).toLocaleDateString("el-CY")}</span>
              </div>
              <h3 className="mt-2 text-sm font-bold">{entry.original_subject||entry.original_sender||"Μήνυμα"}</h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{entry.original_text.slice(0,600)}</p>
            </article>
          ))}
          {visible.length===0&&<p className="py-8 text-sm text-slate-500">Δεν υπάρχουν εισαγμένες επικοινωνίες για εμφάνιση.</p>}
        </div>
        <p className="mt-5 text-xs text-slate-500">
          Για επαφές, άνοιξε <Link href="/contacts" className="underline">τις ιδιωτικές επαφές σου</Link>.
          Η σύνδεση με ζωντανά εξωτερικά inbox απαιτεί εξουσιοδοτημένο προσαρμογέα ανά πάροχο.
        </p>
      </section>
    </div>
  );
}
