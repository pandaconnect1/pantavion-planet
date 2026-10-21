/**
 * Read ONLY user-selected exports locally for preview.
 * No file bytes sent to the backend until explicit confirmation.
 * This deliberately does not parse attachments, HTML-only MIME or encrypted backups.
 */
export type ImportProvider =
  "email_eml" | "email_mbox" | "whatsapp_export" | "chat_text_export";
export type ImportedEntry = {
  kind: "email" | "chat"; sender?: string | null; recipient?: string | null;
  subject?: string | null; text: string; sentAt?: string | null;
};
const MAX_RECORDS=50;
const MAX_FILE_BYTES=500_000;

export function importFormatFromName(filename:string):ImportProvider|null {
  const name=filename.toLowerCase();
  if(name.endsWith(".eml")) return "email_eml";
  if(name.endsWith(".mbox")) return "email_mbox";
  if(name.endsWith(".txt")) return "chat_text_export";
  return null;
}
function header(text:string,name:string):string|null {
  const head=text.split(/\r?\n\r?\n/,1)[0]||"";
  const unfolded=head.replace(/\r?\n[ \t]+/g," ");
  const line=unfolded.split(/\r?\n/).find(x=>x.toLowerCase().startsWith(name.toLowerCase()+":"));
  return line?.slice(name.length+1).trim().slice(0,250)||null;
}
function parseEmail(raw:string):ImportedEntry|null {
  const normalized=raw.replace(/^From [^\r\n]+\r?\n/,"");
  const split=/\r?\n\r?\n/.exec(normalized);
  if(!split || split.index===undefined) return null;
  const head=normalized.slice(0,split.index);
  const type=(header(head,"content-type")||"text/plain").toLowerCase();
  const encoding=(header(head,"content-transfer-encoding")||"7bit").toLowerCase();
  // Do not corrupt MIME boundaries or claim unsupported attachments are imported.
  if(type.includes("multipart/")||type.includes("text/html")||encoding.includes("base64")||
     encoding.includes("quoted-printable")) return null;
  const text=normalized.slice(split.index+split[0].length).trim();
  if(!text||text.length>8000) return null;
  return {
    kind:"email",sender:header(head,"from"),recipient:header(head,"to"),
    subject:header(head,"subject"),text,sentAt:null,
  };
}
function parseWhatsApp(text:string):ImportedEntry[] {
  const out:ImportedEntry[]=[];
  // Common official exports: [01/12/2026, 17:02:11] Name: Text
  // or 01/12/2026, 17:02 - Name: Text; dates left unparsed if ambiguous.
  const rows=text.split(/\r?\n/);
  for (const row of rows) {
    const match=/^(?:\[\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?\]\s*|\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?:\s?[APap][Mm])?\s*[-–]\s*)([^:]{1,250}):\s*(.+)$/.exec(row);
    if(match){
      const sender=match[1].trim(),message=match[2].trim();
      if(message && message.length<=8000)
        out.push({kind:"chat",sender,text:message,sentAt:null});
    } else if (out.length && row.trim()) {
      const previous=out[out.length-1];
      if(previous.text.length+row.length+1<=8000) previous.text+="\n"+row;
    }
    if(out.length>MAX_RECORDS) throw Error("Το αρχείο έχει πάνω από 50 μηνύματα. Εξήγαγε μικρότερο τμήμα.");
  }
  return out;
}
export function previewUserExport(filename:string,text:string):{
  provider:ImportProvider;records:ImportedEntry[];
} {
  if(new TextEncoder().encode(text).length>MAX_FILE_BYTES) throw Error("Μέγιστο αρχείο 500 KB.");
  const provider=importFormatFromName(filename);
  if(!provider) throw Error("Επιτρέπονται .eml, .mbox και επίσημα αρχεία συνομιλίας .txt.");
  let records:ImportedEntry[]=[];
  if(provider==="email_eml") {
    const e=parseEmail(text);
    if(e) records=[e];
  }else if(provider==="email_mbox"){
    const segments=text.replace(/\r\n/g,"\n").split(/^From [^\n]+\n/gm).filter(Boolean);
    records=segments.map(parseEmail).filter((x):x is ImportedEntry=>Boolean(x));
  }else records=parseWhatsApp(text);
  if(records.length===0) throw Error("Δεν αναγνωρίστηκε υποστηριζόμενο απλό κείμενο. Κρυπτογραφημένα αντίγραφα, συνημμένα και HTML-only email δεν υποστηρίζονται.");
  if(records.length>MAX_RECORDS) throw Error("Το όριο είναι 50 μηνύματα ανά αρχείο.");
  return {provider,records};
}
