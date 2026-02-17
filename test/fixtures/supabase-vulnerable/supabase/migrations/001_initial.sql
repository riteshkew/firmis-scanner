-- Migration: Initial schema setup
-- This migration has multiple security issues for testing

-- ISSUE: Table without RLS (supa-rls-001)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ISSUE: Table without RLS (supa-rls-001)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES users(id),
  full_name text,
  avatar_url text,
  bio text
);

-- Table with RLS enabled but no policies (supa-rls-002)
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  title text NOT NULL,
  content text,
  published boolean DEFAULT false
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Properly secured table (should NOT trigger)
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id),
  user_id uuid REFERENCES users(id),
  content text NOT NULL
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own comments" ON comments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comments" ON comments
FOR INSERT WITH CHECK (auth.uid() = user_id);
