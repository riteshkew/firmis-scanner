-- ============================================
-- VIBE CODER: Common AI-assisted development mistakes
-- "It works on my machine" / "Claude/GPT told me to do this"
-- ============================================

-- MISTAKE #1: Copy-pasted from tutorial without understanding
-- Tutorial said "for testing, use USING (true)"
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2),
  seller_id uuid REFERENCES auth.users(id)
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- "I'll fix this later" - Narrator: They never did
CREATE POLICY "temporary_allow_all" ON products FOR ALL USING (true);

-- MISTAKE #2: AI suggested this "simple auth check"
-- Problem: role() returns the database role, not the app role
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  total decimal(10,2),
  status text DEFAULT 'pending'
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_access" ON orders
  FOR ALL USING (current_setting('role') = 'authenticated');
-- This doesn't work as intended!

-- MISTAKE #3: Forgot to enable RLS after creating policies
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- Created policies but forgot the ALTER TABLE
CREATE POLICY "users_own_keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);
-- RLS not enabled = policies do nothing!

-- MISTAKE #4: Wrong column in policy (typo)
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,  -- Note: owner_id, not user_id
  content text,
  is_public boolean DEFAULT false
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON documents
  FOR ALL USING (auth.uid() = user_id);  -- TYPO: user_id doesn't exist!
-- This policy will error or return no rows

-- MISTAKE #5: Using service_role for "convenience"
-- "The anon key wasn't working so I used service_role"
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  preferences jsonb DEFAULT '{}'
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_users" ON user_settings
  FOR ALL USING (auth.role() = 'service_role');
-- Only service_role can access = broken for users!

-- MISTAKE #6: OR instead of AND in policy (logic error)
CREATE TABLE private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid,
  recipient_id uuid,
  message text,
  read_at timestamptz
);
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message_access" ON private_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id OR true
    -- Vibe coder added "OR true" to "fix" a bug
  );

-- MISTAKE #7: Disabled RLS for debugging, forgot to re-enable
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  amount decimal(10,2),
  stripe_id text,
  status text
);
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;  -- Commented out for debugging
-- TODO: uncomment before deploy

-- MISTAKE #8: Public bucket for "user uploads"
-- "I couldn't figure out storage policies so I made it public"
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', true);
-- All user documents are now public!

-- MISTAKE #9: Overly broad SECURITY DEFINER function
-- "I needed to bypass RLS for this one thing"
CREATE OR REPLACE FUNCTION get_all_user_data(target_email text)
RETURNS TABLE (id uuid, email text, data jsonb) AS $$
BEGIN
  RETURN QUERY SELECT u.id, u.email, u.raw_user_meta_data
  FROM auth.users u
  WHERE u.email ILIKE '%' || target_email || '%';  -- SQL injection!
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- MISTAKE #10: Storing secrets in user_metadata
-- "It was the easiest place to put it"
-- (This would be in app code, but the policy allows it)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text,
  settings jsonb
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_access" ON user_profiles
  FOR ALL USING (
    auth.uid() = id OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );
-- user_metadata is user-controllable!

-- MISTAKE #11: SELECT * in RLS policy subquery (performance bomb)
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid,
  user_id uuid,
  role text
);
CREATE TABLE team_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid,
  filename text,
  content bytea
);
ALTER TABLE team_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_access" ON team_files
  FOR ALL USING (
    team_id IN (SELECT * FROM team_members WHERE user_id = auth.uid())
    -- SELECT * in subquery = returns all columns, not just team_id
  );

-- MISTAKE #12: No DELETE policy (data accumulates forever)
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text,
  user_id uuid,
  timestamp timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_only" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "read_own" ON audit_logs FOR SELECT USING (user_id = auth.uid());
-- No DELETE policy = infinite storage growth

-- MISTAKE #13: JWT expiry set to "never" for "better UX"
-- (This would be in config, simulating via comment)
-- jwt_expiry = 31536000  -- 1 year, "so users don't have to log in again"

-- MISTAKE #14: Soft-delete without updating policies
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  deleted_at timestamptz  -- Soft delete field
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_access" ON customers
  FOR SELECT USING (auth.uid() IS NOT NULL);
-- Doesn't filter out deleted_at IS NOT NULL!
-- "Deleted" customers are still visible

-- MISTAKE #15: Using now() in policy (time-based bypass)
CREATE TABLE limited_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code text,
  valid_until timestamptz
);
ALTER TABLE limited_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "valid_offers" ON limited_offers
  FOR SELECT USING (valid_until > now());
-- Attacker can use clock skew or find offers before they're "valid"
