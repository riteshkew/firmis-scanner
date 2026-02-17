-- Migration: Examples of vulnerabilities detected by Supabase Splinter
-- https://github.com/supabase/splinter

-- ============================================
-- ISSUE: SECURITY DEFINER function without SET search_path (supa-func-002)
-- This is vulnerable to search path injection attacks
-- ============================================
CREATE OR REPLACE FUNCTION unsafe_admin_action(target_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
-- Missing: SET search_path = public, pg_temp
AS $$
BEGIN
  -- Attacker could create a malicious "users" table in a writable schema
  -- and have this function operate on it instead
  UPDATE users SET is_admin = true WHERE id = target_user;
END;
$$;

-- Safe version (should NOT trigger supa-func-002)
CREATE OR REPLACE FUNCTION safe_admin_action(target_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE users SET is_admin = true WHERE id = target_user;
END;
$$;

-- ============================================
-- ISSUE: SECURITY DEFINER view (supa-view-001)
-- Views with security_definer bypass RLS
-- ============================================
CREATE VIEW admin_all_users
WITH (security_definer = true)
AS SELECT id, email, is_admin FROM users;

-- Another SECURITY DEFINER view pattern
CREATE OR REPLACE VIEW sensitive_data_view
WITH (security_definer = true)
AS SELECT * FROM profiles WHERE is_premium = true;

-- Safe view (should NOT trigger)
CREATE VIEW public_posts
WITH (security_invoker = true)
AS SELECT id, title, content FROM posts WHERE published = true;

-- ============================================
-- ISSUE: Extension in public schema (supa-ext-001)
-- Extensions in public schema may be exposed via API
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- No schema = public
CREATE EXTENSION pgcrypto SCHEMA public;     -- Explicit public

-- Safe extension (should NOT trigger)
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- ============================================
-- ISSUE: Multiple permissive policies (supa-rls-007)
-- Having many permissive policies can unintentionally widen access
-- ============================================
CREATE TABLE team_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  content text
);

ALTER TABLE team_documents ENABLE ROW LEVEL SECURITY;

-- Policy 1: Team members can read
CREATE POLICY "team_read" ON team_documents
AS PERMISSIVE
FOR SELECT
USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

-- Policy 2: Owners can read
CREATE POLICY "owner_read" ON team_documents
AS PERMISSIVE
FOR SELECT
USING (owner_id = auth.uid());

-- Policy 3: Admins can read
CREATE POLICY "admin_read" ON team_documents
AS PERMISSIVE
FOR SELECT
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Policy 4: Public docs are readable
CREATE POLICY "public_read" ON team_documents
AS PERMISSIVE
FOR SELECT
USING (is_public = true);

-- Note: These 4 permissive policies are OR'd together, meaning:
-- A user can read if they're a team member OR owner OR admin OR if doc is public
-- This may be intended, but often leads to unintended access

-- ============================================
-- Helper table for policies
-- ============================================
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL
);

CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL
);
