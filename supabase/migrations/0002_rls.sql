-- ============================================================
-- Single-user mode — no auth, no RLS.
-- Server code uses the service_role key which bypasses RLS anyway.
-- If auth is added later, re-enable RLS + policies here.
-- ============================================================

select 1;
