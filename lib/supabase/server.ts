import { createClient as createSbClient, type SupabaseClient } from "@supabase/supabase-js";

// Single-user mode: no auth, no cookies. Uses service_role on the server so
// all reads/writes bypass RLS. Never import this from a Client Component.
//
// If env vars are missing or still on placeholder values, returns a stub
// client whose queries resolve to { data: [], count: 0, error: <msg> } —
// this lets the app render (with empty data) on a fresh Vercel deploy
// before real Supabase credentials are wired up.
export async function createClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isReal =
    !!url &&
    !!key &&
    !url.includes("placeholder") &&
    !key.includes("placeholder") &&
    url.startsWith("https://") &&
    url.includes(".supabase.co");

  if (!isReal) return stubClient();

  return createSbClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Chainable no-op query builder that always resolves to empty results.
function stubClient(): SupabaseClient {
  const emptyResult = { data: [], count: 0, error: { message: "Supabase not configured" } };

  const builder: Record<string, unknown> = {};
  const chain = (): Record<string, unknown> => builder;
  const methods = [
    "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "gt", "gte", "lt", "lte",
    "like", "ilike", "in", "is", "not", "or", "and",
    "order", "limit", "range", "single", "maybeSingle", "head",
    "filter", "match", "contains", "containedBy", "textSearch",
  ];
  for (const m of methods) builder[m] = chain;
  builder.then = (resolve: (v: typeof emptyResult) => unknown) => resolve(emptyResult);

  return {
    from: () => builder,
    rpc: () => builder,
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  } as unknown as SupabaseClient;
}
