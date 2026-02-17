-- Edge case tests for SQL parser

-- Edge case: Multi-line CREATE TABLE
CREATE TABLE
  multi_line_table (
    id uuid PRIMARY KEY,
    data jsonb
  );

-- Edge case: Schema-qualified table
CREATE TABLE myschema.custom_table (
  id serial PRIMARY KEY
);
ALTER TABLE myschema.custom_table ENABLE ROW LEVEL SECURITY;

-- Edge case: Policy with complex nested parentheses
CREATE POLICY "complex_policy" ON users
FOR SELECT USING (
  (auth.uid() = id) OR
  (role = 'admin' AND (
    department_id IN (SELECT id FROM departments WHERE manager_id = auth.uid())
  ))
);

-- Edge case: Policy with USING (true) but in a comment
-- This should NOT trigger: USING (true)
CREATE POLICY "safe_policy" ON posts
FOR SELECT USING (published = true);

-- Edge case: WITH CHECK without USING (valid for INSERT)
CREATE POLICY "insert_only" ON profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Edge case: Mixed case keywords
create policy "lowercase_policy" on users
for select using (auth.uid() = id);

CREATE POLICY "UPPERCASE_POLICY" ON USERS
FOR SELECT USING (AUTH.UID() = ID);

-- Edge case: SECURITY DEFINER with proper auth check (still flagged as warning)
CREATE FUNCTION safe_definer()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  -- Do something safe
END;
$$;

-- Edge case: Public bucket with policy (still flagged for public=true)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true);

CREATE POLICY "anyone_read_public" ON storage.objects
FOR SELECT USING (bucket_id = 'public-assets');
