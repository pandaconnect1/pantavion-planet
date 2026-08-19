import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const CANONICAL_SUPABASE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co";

function firstConfigured(...values: Array<string | undefined>) {
  for (const value of values) {
    const clean = value?.trim();
    if (clean) return clean;
  }
  return "";
}

export function createAdminClient() {
  const url = firstConfigured(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    CANONICAL_SUPABASE_URL,
  );
  const serverKey = firstConfigured(
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!serverKey) {
    throw new Error(
      "Pantavion Supabase admin runtime is missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createSupabaseClient(url, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
