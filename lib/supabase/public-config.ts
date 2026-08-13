const CANONICAL_SUPABASE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co";
const CANONICAL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aHVsdndrYWd6dWZianNkd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDQyMTIsImV4cCI6MjA4MjkyMDIxMn0.Ia_qFLZGXAx5ZcqEw8xSchg5xksnc3vBcp6KGMcJrxA";

export function getSupabasePublicConfig() {
  return {
    url: CANONICAL_SUPABASE_URL,
    publishableKey: CANONICAL_SUPABASE_ANON_KEY,
    source: "canonical_public" as const,
  };
}
