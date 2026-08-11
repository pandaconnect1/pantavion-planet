import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { attachmentId?: string } | null;
  const attachmentId = body?.attachmentId?.trim();
  if (!attachmentId) return NextResponse.json({ error: "attachment_required" }, { status: 400 });

  // This query is intentionally performed with the authenticated client: RLS only returns
  // attachments for posts the current viewer is allowed to see.
  const { data: attachment, error } = await supabase
    .from("social_post_media")
    .select("id,storage_path,mime_type,media_kind")
    .eq("id", attachmentId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  if (!attachment?.storage_path) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const admin = createAdminClient();
    const { data, error: signError } = await admin.storage
      .from("personal-media")
      .createSignedUrl(attachment.storage_path, 300);

    if (signError || !data?.signedUrl) {
      return NextResponse.json({ error: "sign_failed" }, { status: 500 });
    }

    return NextResponse.json({
      url: data.signedUrl,
      mimeType: attachment.mime_type,
      mediaKind: attachment.media_kind,
      expiresIn: 300,
    });
  } catch {
    return NextResponse.json({ error: "media_runtime_not_configured" }, { status: 503 });
  }
}
