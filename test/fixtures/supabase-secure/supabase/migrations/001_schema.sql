-- Migration: Secure schema setup
-- All tables have RLS enabled with proper policies

-- Users table with RLS
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
FOR SELECT USING (auth.uid() = id);

-- Profiles table with RLS
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES users(id),
  full_name text,
  avatar_url text,
  bio text
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable" ON profiles
FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Posts table with RLS
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  title text NOT NULL,
  content text,
  published boolean DEFAULT false
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts" ON posts
FOR SELECT USING (published = true);

CREATE POLICY "Users can read own posts" ON posts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Private storage bucket with policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', false);

CREATE POLICY "Users can read own uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload to own folder" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Safe function using app_metadata (admin-controlled)
CREATE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin',
    false
  );
$$;
