const CANONICAL_SUPABASE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co";
const CANONICAL_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fwTnPNKyOhVKu0TOTljtow_QHLVtZ3m";
const CANONICAL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aHVsdndrYWd6dWZianNkd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDQyMTIsImV4cCI6MjA4MjkyMDIxMn0.Ia_qFLZGXAx5ZcqEw8xSchg5xksnc3vBcp6KGMcJrxA";

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || CANONICAL_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    CANONICAL_SUPABASE_ANON_KEY ||
    CANONICAL_SUPABASE_PUBLISHABLE_KEY;

  return {
    url,
    publishableKey,
    source:
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        ? "environment"
        : "canonical_public_fallback",
  } as const;
}
