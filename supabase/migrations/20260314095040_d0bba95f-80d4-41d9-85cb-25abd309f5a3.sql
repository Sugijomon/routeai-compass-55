
-- Create the lesson-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-images', 'lesson-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload lesson images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-images');

-- Allow public read access
CREATE POLICY "Public read access for lesson images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete lesson images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-images');
