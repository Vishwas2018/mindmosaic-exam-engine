import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Server Supabase client for Server Components, Route Handlers and Server
 * Actions. Reads/writes the session cookie via Next's cookie store. The
 * `setAll` try/catch is the documented pattern: cookie writes throw when
 * called from a Server Component render (read-only), and are safely ignored
 * there because middleware refreshes the session on every request instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — ignore; middleware handles refresh.
        }
      },
    },
  });
}
