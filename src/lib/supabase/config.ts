/**
 * Supabase configuration, read from public env vars. The app runs fine with
 * these unset (guests can still practise) — `isSupabaseConfigured` is false and
 * every auth action fails closed with a friendly "not configured yet" message
 * instead of throwing. Set the two vars in `.env.local` to enable real accounts.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.trim().length > 0 && SUPABASE_ANON_KEY.trim().length > 0;

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Sign-in isn't set up on this device yet. Add your Supabase keys to .env.local to enable accounts.";
