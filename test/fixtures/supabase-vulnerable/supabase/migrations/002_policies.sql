-- Migration: Add policies (with vulnerabilities)

-- ISSUE: Overly permissive policy using true (supa-rls-003)
CREATE POLICY "Anyone can read profiles" ON profiles
FOR SELECT USING (true);

-- ISSUE: Another permissive pattern (supa-rls-003)
CREATE POLICY "Public access" ON users
FOR SELECT USING (1 = 1);

-- ISSUE: INSERT without WITH CHECK (supa-rls-004)
CREATE POLICY "Users can insert profiles" ON profiles
FOR INSERT TO authenticated;

-- ISSUE: UPDATE without WITH CHECK (supa-rls-005)
CREATE POLICY "Users can update own posts" ON posts
FOR UPDATE USING (auth.uid() = user_id);

-- Proper UPDATE policy (should NOT trigger)
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ISSUE: Using user_metadata which is user-controlled (supa-rls-006)
CREATE POLICY "Admins can do everything" ON posts
FOR ALL USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- Another user_metadata usage
CREATE POLICY "Premium users" ON posts
FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_premium')::boolean = true
);

-- Using raw_user_meta_data (supa-rls-006)
CREATE POLICY "Check metadata" ON profiles
FOR SELECT USING (
  raw_user_meta_data ->> 'verified' = 'true'
);
