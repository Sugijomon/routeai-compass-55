-- Create lesson-files storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-files', 'lesson-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload lesson files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-files');

-- Allow public read access
CREATE POLICY "Public read access for lesson files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-files');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete lesson files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-files');