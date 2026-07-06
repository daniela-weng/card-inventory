# Supabase

## Apply migrations

```bash
# One-time link
supabase link --project-ref <your-project-ref>

# Push all migrations
supabase db push

# Optional seed
psql "$DATABASE_URL" -f supabase/seed.sql
```

Alternatively, open the SQL editor in the Supabase dashboard and paste each file in `migrations/` in numeric order.

## Regenerate types

```bash
supabase gen types typescript --linked > lib/db-types.ts
```

## Migration order

1. `0001_init.sql` — enums, 10 tables, indexes, updated_at + display_id triggers
2. `0002_rls.sql` — RLS enabled + `auth.uid() = user_id` policies on every table
