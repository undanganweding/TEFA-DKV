-- Migration: 016_fix_is_admin_recursion.sql

-- ==========================================================
-- FIX: INFINITE RECURSION IN is_admin()
-- ==========================================================
-- PostgreSQL can inline `LANGUAGE sql` functions, even if they are 
-- SECURITY DEFINER, when evaluated inside RLS policies.
-- This causes the inner SELECT FROM profiles to be evaluated under the 
-- caller's security context, re-triggering the policy and causing an infinite loop.
-- Changing to `LANGUAGE plpgsql` prevents inlining and enforces SECURITY DEFINER.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
    AND status = 'Active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
