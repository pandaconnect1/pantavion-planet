"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { pantavionWaterApprovedDeviceHeaders } from "@/core/water/water-approved-device-client";

type Item={ref:string;category:string;label:string;x:number;y:number;layer:string;off:boolean;frozen:boolean;beyondPriorCutoff:boolean;registerNumbers:string[]};
type Report={layers:{id:number;name:string;off:boolean;frozen:boolean;segments:number;texts:number;blocks:number}[];items:Item[];total:number;summary:{evidence:number;hiddenEvidence:number;unmatchedEvidence:number;categories:Record<string,number>};extractorStats:{notReproduced?:Record<string,number>};createdAt:string};
const labels:Record<string,string>={tank:"Δεξαμενές / ντεπόζιτα",valve:"Βάνες / βαλβίδες",street:"Οδοί",area:"Περιοχές / ζώνες",pump:"Αντλιοστάσια",borehole:"Γεωτρήσεις / πηγές",hydrant:"Υδροστόμια",meter:"Μετρητές",flow:"Ροή / τροφοδοσία",unclassified_block:"Μη ταξινομημένα σύμβολα"};
export default function WaterDrawingDiscovery({initialCategory="",queryValue,onQueryChange}:{initialCategory?:string;queryValue?:string;onQueryChange?:(value:string)=>void}){
 const [q,setQ]=useState("");const [category,setCategory]=useState(initialCategory);const [hidden,setHidden]=useState(false);const [unmatched,setUnmatched]=useState(false);
 const query=queryValue??q;
 const updateQuery=(value:string)=>{setOffset(0);if(onQueryChange)onQueryChange(value);else setQ(value);};
 const [offset,setOffset]=useState(0);const [data,setData]=useState<Report|null>(null);const [status,setStatus]=useState("loading");const [version,setVersion]=useState(0);
 useEffect(()=>{setOffset(0);},[query,category,hidden,unmatched]);
 useEffect(()=>{
  const controller=new AbortController();setStatus("loading");setData(null);
  const timer=setTimeout(async()=>{try{
   const p=new URLSearchParams({view:"discovery",q:query,category,hidden:hidden?"1":"0",unmatched:unmatched?"1":"0",offset:String(offset),limit:"100"});
   const r=await fetch(`/api/professional/infrastructure/water/register?${p}`,{credentials:"include",cache:"no-store",headers:pantavionWaterApprovedDeviceHeaders(),signal:controller.signal});
   const body=await r.json();if(controller.signal.aborted)return;
   if(!r.ok||!body.ok){setStatus(r.status===403?"denied":"error");return;}setData(body);setStatus("ready");
  }catch{if(!controller.signal.aborted)setStatus("error");}},350);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query,category,hidden,unmatched,offset,version]);
 return <section className="space-y-5 rounded-2xl border border-slate-700 bg-[#050b16] p-4 text-white">
  <h2 className="text-2xl font-bold">Συμπληρωματικά στοιχεία από το DWG</h2>
  <p>Επιγραφές και σύμβολα από ορατά, σβηστά και παγωμένα επίπεδα. Η ταξινόμηση υποδεικνύει τι χρειάζεται εξέταση. Οι εγγραφές δεν αποτελούν καταμέτρηση διαφορετικών εγκαταστάσεων ή επαληθευμένες συνδέσεις τροφοδοσίας.</p>
  <div className="grid gap-3 md:grid-cols-2"><label>Κείμενο, οδός, επίπεδο ή αριθμός μητρώου<input value={query} onChange={e=>updateQuery(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-[#091426] p-3"/></label><label>Κατηγορία ένδειξης<select value={category} onChange={e=>{setOffset(0);setCategory(e.target.value);}} className="mt-2 w-full rounded-xl border border-slate-600 bg-[#091426] p-3"><option value="">Όλες</option>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}{data?.summary.categories[k]!==undefined?` (${data.summary.categories[k]})`:""}</option>)}</select></label></div>
  <div className="flex flex-wrap gap-5"><label><input type="checkbox" checked={hidden} onChange={e=>{setOffset(0);setHidden(e.target.checked);}}/> Μόνο σβηστά / παγωμένα</label><label><input type="checkbox" checked={unmatched} onChange={e=>{setOffset(0);setUnmatched(e.target.checked);}}/> Χωρίς ταύτιση θέσης με το μητρώο</label></div>
  <p role="status">{status==="loading"?"Αναζήτηση στην απογραφή…":status==="denied"?"Απαιτείται εγκεκριμένη πρόσβαση Ύδρευσης.":status==="error"?"Η απογραφή δεν είναι διαθέσιμη ή δεν φορτώθηκε.":`${data?.total} αποτελέσματα · ${offset+1}–${offset+(data?.items.length??0)}`}</p>
  {status==="error"?<button onClick={()=>setVersion(v=>v+1)} className="rounded-xl border p-3">Επανάληψη</button>:null}
  {data?<><p>Σύνολο ενδείξεων: {data.summary.evidence} · από κρυφά επίπεδα: {data.summary.hiddenEvidence} · χωρίς ταύτιση θέσης στο μητρώο: {data.summary.unmatchedEvidence}. Η μη ταύτιση δεν αποδεικνύει ότι λείπει πραγματική εγκατάσταση.</p>
   <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Κατηγορία","Επιγραφή / σύμβολο","Επίπεδο","Κατάσταση πηγής","Συσχέτιση μητρώου","Θέση σχεδίου"].map(h=><th scope="col" key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{data.items.map(r=><tr key={r.ref} className="border-t border-slate-700"><td className="p-3">{labels[r.category]??r.category}</td><td>{r.label||"Χωρίς επιγραφή"}<span className="block text-xs text-slate-400">{r.ref}</span></td><td>{r.layer}</td><td>{[r.off?"Σβηστό":"",r.frozen?"Παγωμένο":"",r.beyondPriorCutoff?"Εκτός προηγούμενου ορίου εξαγωγής":""].filter(Boolean).join(" · ")||"Ορατό"}</td><td>{r.registerNumbers.join(", ")||"Χωρίς ταύτιση θέσης"}</td><td><Link className="text-sky-200" href={`/professional/infrastructure/water/master-b-mobile?${new URLSearchParams({sourceKey:"canonical-2026-andreaspap",viewId:"D",x:String(r.x),y:String(r.y)})}`}>{r.x.toFixed(2)}, {r.y.toFixed(2)} ↗</Link></td></tr>)}</tbody></table></div>
   <nav className="flex gap-3" aria-label="Σελίδες ευρημάτων"><button disabled={!offset} onClick={()=>setOffset(Math.max(0,offset-100))} className="rounded-xl border p-3 disabled:opacity-40">Προηγούμενα</button><button disabled={offset+data.items.length>=data.total} onClick={()=>setOffset(offset+100)} className="rounded-xl border p-3 disabled:opacity-40">Επόμενα</button></nav>
   <details><summary>Όλα τα επίπεδα και το περιεχόμενό τους ({data.layers.length})</summary><div className="max-h-96 overflow-auto"><table className="w-full text-left text-xs"><thead><tr>{["Επίπεδο","Κατάσταση","Τμήματα γραμμών","Επιγραφές","Σύμβολα"].map(h=><th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead><tbody>{data.layers.map(l=><tr key={l.id} className="border-t border-slate-700"><td className="p-2">{l.name}</td><td>{[l.off?"Σβηστό":"",l.frozen?"Παγωμένο":""].filter(Boolean).join(" · ")||"Ορατό"}</td><td>{l.segments}</td><td>{l.texts}</td><td>{l.blocks}</td></tr>)}</tbody></table></div></details>
   <details><summary>Τύποι στοιχείων που δεν αναπαρήγαγε ο μετατροπέας</summary><pre className="overflow-x-auto p-3 text-xs">{JSON.stringify(data.extractorStats.notReproduced??{},null,2)}</pre></details>
  </>:null}
 </section>;
}
