// Placeholder. Generate real types with:
//   supabase gen types typescript --linked > lib/db-types.ts
// Until then, code that needs DB types can `import type { Database } from "@/lib/db-types"`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
