import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError && !user) {
      return NextResponse.json(
        { error: "authentication_failed", detail: authError.message },
        { status: 503 },
      );
    }

    if (!user) {
      return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    }

    const { error: enableError } = await supabase.rpc(
      "pantavion_enable_contact_discovery",
    );

    if (enableError) {
      return NextResponse.json(
        { error: "contact_discovery_enable_failed", detail: enableError.message },
        { status: 503 },
      );
    }

    const { data, error } = await supabase.rpc(
      "pantavion_find_people_from_my_contacts",
    );

    if (error) {
      return NextResponse.json(
        { error: "discovery_failed", detail: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, matches: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: "people_discovery_runtime_unavailable",
        detail: error instanceof Error ? error.message : "runtime unavailable",
      },
      { status: 503 },
    );
  }
}
