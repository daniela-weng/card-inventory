import { createClient as createSbClient } from "@supabase/supabase-js";

// Single-user mode: no auth, no cookies. Uses service_role on the server so
// all reads/writes bypass RLS. Never import this from a Client Component.
export async function createClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
