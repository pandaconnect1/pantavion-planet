import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  const now = new Date().toISOString();
  const { error: consentError } = await supabase.from("consent_records").insert({
    user_id: user.id,
    purpose: "contact_discovery",
    status: "granted",
    source: "find_my_people",
    granted_at: now,
    metadata: { initiated_by: "user" },
  });
  if (consentError) {
    return NextResponse.json({ error: "consent_failed", detail: consentError.message }, { status: 500 });
  }

  const { error: privacyError } = await supabase
    .from("user_privacy_settings")
    .update({ contact_import_enabled: true, updated_at: now })
    .eq("user_id", user.id);
  if (privacyError) {
    return NextResponse.json({ error: "privacy_update_failed", detail: privacyError.message }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("pantavion_find_people_from_my_contacts");
  if (error) return NextResponse.json({ error: "discovery_failed", detail: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, matches: data ?? [] });
}
