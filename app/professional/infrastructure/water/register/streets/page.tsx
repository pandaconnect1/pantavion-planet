"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { pantavionWaterApprovedDeviceHeaders } from "@/core/water/water-approved-device-client";
import { collectWaterRegisterPrintRows } from "@/core/infrastructure/water/water-register-print";
import type { DirectoryStreet } from "@/core/infrastructure/water/water-street-directory";

type Result = { ok:boolean; streets:DirectoryStreet[]; total:number; partial:boolean; warnings:string[]; localities:string[][]; coverage:{officialStreetLocalityPairs:number;postalSourceRows:number;streetLocalities:number;drawingLabels:number} };
const sourceLabel:Record<string,string> = {CYPRUS_POST_2024:"Κυπριακά Ταχυδρομεία · 2024",CYPRUS_POST:"Ταχυδρομικό μητρώο",DWG_B_D:"DWG · Β/Δ",FIELD:"Καταγραφή χρήστη"};
const escape = (v:unknown) => String(v ?? "").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
const cells = (r:DirectoryStreet) => [r.municipality_or_community || "Προς ταυτοποίηση",r.name_el || r.name_lat,r.name_lat || "—",r.zone_or_section || "Μη καταγεγραμμένη",[...r.postal_codes,...r.street_ranges].join(" / ") || "—",sourceLabel[r.source] || r.source,r.status === "pending_review" ? "Προς έγκριση" : r.record_kind === "drawing_label" ? "Επιγραφή προς ταυτοποίηση" : "Καταχώριση πηγής"];
const headings = ["Περιοχή","Οδός","Λατινική ονομασία","Ζώνη / περίγραμμα DWG","Τ.Κ. / όρια","Πηγή","Κατάσταση"];
async function readPage(q:string,locality:string,source:string,offset:number,signal?:AbortSignal,limit=200):Promise<Result> {
  const params=new URLSearchParams({q,locality,source,offset:String(offset),limit:String(limit)});
  const response=await fetch(`/api/professional/infrastructure/water/street-directory?${params}`,{credentials:"include",cache:"no-store",headers:pantavionWaterApprovedDeviceHeaders(),signal});
  const body=await response.json();
  if(!response.ok || !body.ok) throw new Error(response.status===403 ? "Απαιτείται εγκεκριμένη πρόσβαση Ύδρευσης." : "Ο κατάλογος δεν φορτώθηκε. Πατήστε επανάληψη.");
  return body;
}
export default function WaterStreetDirectoryPage() {
  const [q,setQ]=useState(""); const [locality,setLocality]=useState(""); const [source,setSource]=useState("");
  const [offset,setOffset]=useState(0); const [version,setVersion]=useState(0);
  const [data,setData]=useState<Result|null>(null); const [status,setStatus]=useState("Φόρτωση…"); const [printing,setPrinting]=useState(false);
  useEffect(()=>{
    const controller=new AbortController(); let pending=false;
    setData(null); setStatus("Φόρτωση…");
    const refresh=async()=>{
      if(pending || controller.signal.aborted)return;
      pending=true;
      try {const body=await readPage(q,locality,source,offset,controller.signal);if(!controller.signal.aborted){setData(body);setStatus("");}}
      catch(error){if(!controller.signal.aborted)setStatus(error instanceof Error?error.message:"Η ανάγνωση απέτυχε.");}
      finally{pending=false;}
    };
    const initial=window.setTimeout(()=>void refresh(),250);
    const timer=window.setInterval(()=>{if(!document.hidden)void refresh();},20000);
    const focus=()=>void refresh();window.addEventListener("focus",focus);
    return()=>{controller.abort();clearTimeout(initial);clearInterval(timer);window.removeEventListener("focus",focus);};
  },[q,locality,source,offset,version]);
  async function print(all:boolean){
    const popup=window.open("","_blank");if(!popup){setStatus("Επιτρέψτε το παράθυρο εκτύπωσης στον browser.");return;}
    popup.document.write("<p>Συλλογή ολόκληρου του καταλόγου…</p>");setPrinting(true);
    try{
      const rows=await collectWaterRegisterPrintRows(async(position)=>{
        const page=await readPage(all?"":q,all?"":locality,all?"":source,position,undefined,500);
        if(page.partial)throw new Error("Δεν φορτώθηκαν όλες οι πηγές. Η εκτύπωση διακόπηκε για να μη δοθεί ελλιπής κατάλογος.");
        return {assets:page.streets.map((r)=>({...r,number:r.id})),total:page.total};
      });
      popup.document.open();popup.document.write(`<!doctype html><html lang="el"><head><meta charset="utf-8"><title>Οδοί Λεμεσού</title><style>body{font:11px Arial}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:5px;text-align:left}thead{display:table-header-group}tr{break-inside:avoid}</style></head><body><h1>Κατάλογος οδών επαρχίας Λεμεσού</h1><p>${escape(all?"Ολόκληρος κατάλογος":`Φίλτρα: ${q} / ${locality} / ${source}`)} · ${rows.length} καταχωρίσεις · ${escape(new Date().toLocaleString("el-CY"))}</p><p>Πηγή: Κυπριακά Ταχυδρομεία, δημοσίευση 18/09/2024, data.gov.cy, CC BY 4.0. Οι επιγραφές DWG είναι στοιχεία σχεδίου προς ταυτοποίηση. Ο αριθμός δεν αποτελεί καταμέτρηση μοναδικών φυσικών οδών.</p><table><thead><tr>${headings.map((h)=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r)=>`<tr>${cells(r).map((v)=>`<td>${escape(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`);
      popup.document.close();popup.focus();popup.print();
    }catch(error){popup.close();setStatus(error instanceof Error?error.message:"Η εκτύπωση απέτυχε.");}finally{setPrinting(false);}
  }
  const input="rounded-xl border border-slate-600 bg-[#091426] p-3";
  return <main className="min-h-screen bg-[#050b16] p-4 text-white"><section className="mx-auto max-w-7xl space-y-4">
    <header className="rounded-2xl border border-slate-700 bg-[#091426] p-5"><Link href="/professional/infrastructure/water/register" className="text-sky-200">← Μητρώο δικτύου / SV</Link><h1 className="mt-3 text-3xl font-bold">Ενιαίος κατάλογος οδών επαρχίας Λεμεσού</h1><p className="mt-2">Οδοί πόλης και χωριών, επιγραφές DWG και νέες καταγραφές χρηστών.</p><p className="mt-2 text-sm text-amber-200">Οι ομώνυμες οδοί διαφορετικών περιοχών διατηρούνται. Οι επιγραφές DWG δεν συγχωνεύονται με ταχυδρομικές οδούς μόνο λόγω ονόματος. Η συνολική κάλυψη του 2026 και οι θέσεις όλων των οδών δεν έχουν επαληθευτεί.</p>{data?<p className="mt-3 font-bold text-emerald-200">{data.coverage.officialStreetLocalityPairs.toLocaleString("el-CY")} ονομασίες ανά περιοχή · {data.coverage.streetLocalities} περιοχές με οδούς · {data.coverage.drawingLabels.toLocaleString("el-CY")} επιγραφές DWG</p>:null}</header>
    <div className="flex flex-wrap gap-3"><Link href="/professional/infrastructure/water/live" className={input}>+ Νέα οδός στον χάρτη Α</Link><Link href="/professional/infrastructure/water/d" className={input}>Χάρτης Δ</Link><button type="button" disabled={printing} onClick={()=>void print(false)} className={input}>Εκτύπωση αποτελεσμάτων</button><button type="button" disabled={printing} onClick={()=>void print(true)} className={input}>Εκτύπωση ολόκληρου καταλόγου</button></div>
    <div className="grid gap-3 md:grid-cols-3"><label className="grid gap-1">Περιοχή / δήμος / χωριό<input list="limassol-localities" value={locality} onChange={(e)=>{setLocality(e.target.value);setOffset(0);}} placeholder="π.χ. Ύψωνας / Ypsonas" className={input}/></label><datalist id="limassol-localities">{(data?.localities||[]).map(([el,en])=><option key={`${el}:${en}`} value={el}>{en}</option>)}</datalist><label className="grid gap-1">Οδός, περιοχή, ζώνη ή Τ.Κ.<input value={q} onChange={(e)=>{setQ(e.target.value);setOffset(0);}} placeholder="Ελληνικά / English / λατινικά" className={input}/></label><label className="grid gap-1">Πηγές<select value={source} onChange={(e)=>{setSource(e.target.value);setOffset(0);}} className={input}><option value="">Όλες μαζί</option><option value="postal">Επίσημος ταχυδρομικός κατάλογος</option><option value="drawing_label">Επιγραφές DWG Β/Δ</option><option value="field">Νέες οδοί χρηστών</option><option value="legacy">Πρόσθετο μητρώο</option></select></label></div>
    <p role="status" aria-live="polite">{status||(data?`${data.total.toLocaleString("el-CY")} καταχωρίσεις · ${data.streets.length?offset+1:0}–${offset+data.streets.length}`:"")}</p>
    {data?.warnings.map((w)=><p role="alert" key={w} className="rounded-xl border border-amber-400 p-3 text-amber-100">{w}</p>)}<button type="button" onClick={()=>setVersion((v)=>v+1)} className={input}>Ανανέωση / επανάληψη</button>
    <div className="overflow-x-auto rounded-2xl border border-slate-700"><table className="w-full text-left text-sm"><caption className="p-3 text-left">Αλφαβητικά ανά περιοχή, ζώνη και οδό. Οι επιγραφές σχεδίου είναι ξεχωριστές καταχωρίσεις.</caption><thead><tr>{[...headings,"Χάρτης"].map((h)=><th key={h} scope="col" className="p-3 text-amber-200">{h}</th>)}</tr></thead><tbody>{data?.streets.map((r)=><tr key={r.id} className="border-t border-slate-700">{cells(r).map((value,i)=><td key={i} className="p-3">{value}{i===0&&r.locality_lat?<small className="block text-slate-400">{r.locality_lat}</small>:null}{i===1&&r.record_kind==="drawing_label"?<small className="block text-slate-400">{r.source_ref} · {r.layer}{r.hidden?" · παγωμένο/σβηστό επίπεδο":""}{r.beyond_prior_cutoff?" · πιθανό αντίγραφο σχεδίου":""}</small>:null}{i===3&&r.zone_basis?<small className="block text-amber-200">{r.zone_basis}</small>:null}</td>)}<td className="p-3">{r.map_href?<Link href={r.map_href} className="font-bold text-sky-200 underline">{r.map_action}</Link>:"Εκκρεμεί ταυτοποίηση θέσης"}</td></tr>)}</tbody></table></div>
    {data&&!data.streets.length?<p>Δεν βρέθηκαν καταχωρίσεις. Αφαιρέστε το φίλτρο περιοχής για τις αταυτοποίητες επιγραφές DWG.</p>:null}
    <nav aria-label="Σελίδες καταλόγου οδών" className="flex gap-3"><button type="button" disabled={!offset} onClick={()=>setOffset(Math.max(0,offset-200))} className={input}>Προηγούμενες</button><button type="button" disabled={!data||offset+data.streets.length>=data.total} onClick={()=>setOffset(offset+200)} className={input}>Επόμενες</button></nav>
    <p className="text-xs text-slate-400">Κυπριακά Ταχυδρομεία · δημοσίευση 18/09/2024 · <a className="underline" href="https://www.data.gov.cy/en/dataset/385" target="_blank" rel="noreferrer">data.gov.cy</a> · CC BY 4.0. Περιλαμβάνονται όλα τα στοιχεία Λεμεσού αυτού του αρχείου. Νέες οδοί χρηστών: ανανέωση ανά 20 δευτερόλεπτα.</p>
  </section></main>;
}
