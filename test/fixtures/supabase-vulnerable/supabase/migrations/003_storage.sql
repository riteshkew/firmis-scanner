-- Migration: Storage buckets setup

-- ISSUE: Public bucket (supa-storage-001)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- ISSUE: Another public bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

-- Private bucket (should NOT trigger supa-storage-001)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- ISSUE: Bucket without policies (supa-storage-002)
-- The 'documents' bucket above has no storage.objects policies

-- Bucket with proper policies (should NOT trigger)
INSERT INTO storage.buckets (id, name, public)
VALUES ('secure-files', 'secure-files', false);

CREATE POLICY "Authenticated users can read secure-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'secure-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload to secure-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'secure-files' AND auth.uid() IS NOT NULL);
