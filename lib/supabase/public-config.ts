const CANONICAL_SUPABASE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co";
const CANONICAL_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fwTnPNKyOhVKu0TOTljtow_QHLVtZ3m";

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || CANONICAL_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || CANONICAL_SUPABASE_PUBLISHABLE_KEY;

  return {
    url,
    publishableKey,
    source:
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        ? "environment"
        : "canonical_public_fallback",
  } as const;
}
