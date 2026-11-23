"use client";

import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Browser Supabase client. Only call this when `isSupabaseConfigured` is true —
 * the AuthProvider guards it. Created per call; Supabase dedupes internally.
 */
export function createClient() {
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      secure: isHttps,
      sameSite: "lax",
    },
  });
}
