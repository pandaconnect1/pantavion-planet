import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Entry = {
  kind: "email" | "chat";
  sender?: string | null; recipient?: string | null; subject?: string | null;
  text: string; sentAt?: string | null;
};
const allowed = new Set(["email_eml","email_mbox","whatsapp_export","chat_text_export"]);
function noCache(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 600_000)
    return noCache({ok:false,error:"payload_too_large"},413);
  const supabase=await createClient();
  const {data,error}=await supabase.auth.getUser();
  if(error||!data.user) return noCache({ok:false,error:"login_required"},401);

  const raw=await request.text().catch(()=>"");
  if(!raw||raw.length>600_000) return noCache({ok:false,error:"invalid_body"},413);
  let body: Record<string, unknown>;
  try {
    const parsed:unknown=JSON.parse(raw);
    if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)) throw Error("bad body");
    body=parsed as Record<string, unknown>;
  } catch { return noCache({ok:false,error:"invalid_json"},400); }

  if(body.action==="revoke") {
    const {error:revokeError}=await supabase.rpc("pantavion_revoke_communications_archive_import");
    return revokeError
      ? noCache({ok:false,error:"revoke_failed"},400)
      : noCache({ok:true,status:"future_import_consent_revoked"},200);
  }

  const provider=body.provider,filename=body.filename,records=body.records;
  if(body.confirmed!==true||typeof provider!=="string"||!allowed.has(provider)||
     typeof filename!=="string"||filename.length<1||filename.length>120||
     !Array.isArray(records)||records.length<1||records.length>50) {
    return noCache({ok:false,error:"explicit_confirmation_or_file_required"},400);
  }
  for(const item of records as Entry[]) {
    if(!item||typeof item!=="object"||!["email","chat"].includes(item.kind)||
       typeof item.text!=="string"||!item.text.trim()||item.text.length>8000) {
      return noCache({ok:false,error:"invalid_message"},400);
    }
  }
  const {data:count,error:importError}=await supabase.rpc("pantavion_import_communication_archive",{
    p_provider:provider,p_filename:filename,p_records:records,p_confirmed:true,
  });
  if(importError) return noCache({ok:false,error:"import_failed"},400);
  return noCache({ok:true,status:"stored_privately",importedCount:Number(count||0)},201);
}

export async function DELETE(request:Request) {
  const supabase=await createClient();
  const {data,error}=await supabase.auth.getUser();
  if(error||!data.user) return noCache({ok:false,error:"login_required"},401);
  const raw=await request.text().catch(()=>"");
  if(raw!=='{"deleteAllImportedCommunications":true}') {
    return noCache({ok:false,error:"explicit_delete_confirmation_required"},400);
  }
  const result=await supabase.rpc("pantavion_delete_imported_communication_archive");
  if(result.error) return noCache({ok:false,error:"delete_failed"},400);
  return noCache({ok:true,status:"own_archive_deleted"},200);
}
