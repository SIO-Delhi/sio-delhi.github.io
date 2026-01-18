-- 1. Enable RLS (if not already enabled)
-- alter table storage.objects enable row level security;

-- 2. Allow Public Read Access (so everyone can hear the audio)
CREATE POLICY "Public Read Audio"
ON storage.objects FOR SELECT
USING ( bucket_id = 'post-audios' );

-- 3. Allow Uploads (Choose one depending on your auth setup)

-- OPTION A: If you are using Supabase Auth (Log In), use this (Recommended):
CREATE POLICY "Authenticated Upload Audio"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'post-audios' AND auth.role() = 'authenticated' );

-- OPTION B: If you are NOT using auth (Public Upload / Admin with Anon Key), use this:
-- CREATE POLICY "Public Upload Audio"
-- ON storage.objects FOR INSERT
-- WITH CHECK ( bucket_id = 'post-audios' );

-- 4. Allow Delete/Update (for managing files)
CREATE POLICY "Authenticated Delete Audio"
ON storage.objects FOR DELETE
USING ( bucket_id = 'post-audios' AND auth.role() = 'authenticated' );
