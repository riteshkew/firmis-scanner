-- ============================================
-- RED TEAM: SQL Obfuscation & Bypass Attempts
-- Goal: Create vulnerabilities that evade static analysis
-- ============================================

-- BYPASS #1: Mixed case to evade regex
-- Scanner uses /i flag but let's test edge cases
CrEaTe TaBlE stealth_users (
  id uuid PRIMARY KEY,
  email text,
  password_hash text
);
-- No RLS - will scanner catch with weird casing?

-- BYPASS #2: Newlines inside keywords
CREATE
  TABLE
    hidden_secrets (
  id uuid PRIMARY KEY,
  api_key text,
  created_at timestamptz
);
-- Scanner regex might not handle multi-line

-- BYPASS #3: Comments inside statements
CREATE TABLE /* this is a decoy */ admin_backdoor (
  id uuid PRIMARY KEY,
  -- more comments to confuse parser
  user_id uuid,
  privilege_level int DEFAULT 9999
);

-- BYPASS #4: Using tabs instead of spaces
CREATE	TABLE	tab_separated	(
	id	uuid	PRIMARY KEY,
	data	jsonb
);

-- BYPASS #5: Policy that LOOKS restrictive but isn't
-- The function always returns true
CREATE TABLE fake_secure (
  id uuid PRIMARY KEY,
  user_id uuid,
  secret_data text
);
ALTER TABLE fake_secure ENABLE ROW LEVEL SECURITY;
CREATE POLICY "looks_secure" ON fake_secure
  FOR ALL USING (check_user_access(auth.uid(), user_id));
-- The function check_user_access() returns true for everyone

CREATE OR REPLACE FUNCTION check_user_access(requesting_user uuid, owner_user uuid)
RETURNS boolean AS $$
BEGIN
  -- BACKDOOR: Always return true
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BYPASS #6: RLS policy with SQL injection in name
CREATE TABLE injectable (id uuid PRIMARY KEY);
ALTER TABLE injectable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "policy'; DROP TABLE users; --" ON injectable FOR SELECT USING (true);

-- BYPASS #7: Unicode lookalikes in identifiers
-- Using Cyrillic 'а' (U+0430) instead of Latin 'a'
-- This might confuse pattern matching
CREATE TABLE users_bаckup (  -- Note: 'а' is Cyrillic
  id uuid PRIMARY KEY,
  email text
);

-- BYPASS #8: Hiding SECURITY DEFINER in a long line
CREATE OR REPLACE FUNCTION innocuous_function() RETURNS void LANGUAGE plpgsql AS $$ BEGIN NULL; END; $$ SECURITY DEFINER;

-- BYPASS #9: Dynamic table creation (can't statically analyze)
CREATE OR REPLACE FUNCTION create_unprotected_table(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('CREATE TABLE %I (id uuid PRIMARY KEY, data text)', table_name);
  -- No RLS enabled on dynamically created tables!
END;
$$ LANGUAGE plpgsql;

-- BYPASS #10: Deferred RLS enable (never actually called)
CREATE TABLE will_enable_later (
  id uuid PRIMARY KEY,
  sensitive_info text
);
-- TODO: Enable RLS before production
-- ALTER TABLE will_enable_later ENABLE ROW LEVEL SECURITY;

-- BYPASS #11: Extension with schema in variable
DO $$
DECLARE
  target_schema text := 'public';
BEGIN
  EXECUTE format('CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA %I', target_schema);
END;
$$;

-- BYPASS #12: SECURITY DEFINER via ALTER FUNCTION
CREATE FUNCTION normal_function() RETURNS void AS $$ BEGIN NULL; END; $$ LANGUAGE plpgsql;
ALTER FUNCTION normal_function() SECURITY DEFINER;

-- BYPASS #13: View that exposes auth.users indirectly
CREATE VIEW exposed_users AS
SELECT u.id, u.email, u.raw_user_meta_data
FROM auth.users u;  -- Direct auth.users access but in a view

-- BYPASS #14: Nested subquery hiding auth.users
CREATE VIEW sneaky_user_data AS
SELECT * FROM (
  SELECT * FROM (
    SELECT id, email FROM auth.users
  ) inner_q
) outer_q;

-- BYPASS #15: CTE hiding sensitive access
WITH user_emails AS (
  SELECT id, email FROM auth.users
)
SELECT * FROM user_emails;
-- This would be in a function, hard to detect statically
