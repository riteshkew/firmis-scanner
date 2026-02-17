-- Migration: Database functions

-- ISSUE: SECURITY DEFINER function without auth check (supa-func-001)
CREATE FUNCTION get_all_users()
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM users;
$$;

-- ISSUE: Another SECURITY DEFINER function
CREATE OR REPLACE FUNCTION admin_delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM users WHERE id = user_id;
END;
$$;

-- ISSUE: SECURITY DEFINER that bypasses RLS
CREATE FUNCTION get_user_by_email(email_param text)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user users;
BEGIN
  SELECT * INTO found_user FROM users WHERE email = email_param;
  RETURN found_user;
END;
$$;

-- Safe function using SECURITY INVOKER (should NOT trigger)
CREATE FUNCTION get_current_user_profile()
RETURNS profiles
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$;

-- Default security (INVOKER) - should NOT trigger
CREATE FUNCTION count_posts()
RETURNS integer
LANGUAGE sql
AS $$
  SELECT count(*)::integer FROM posts WHERE published = true;
$$;
