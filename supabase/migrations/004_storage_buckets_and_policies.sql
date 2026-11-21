-- =============================================================================
-- NILORA TRENDS - SUPABASE POSTGRESQL MIGRATION 004
-- Supabase Storage Buckets & Granular Security Policies
-- =============================================================================

-- 1. Create Storage Buckets if they do not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'product-media', 
    'product-media', 
    true, 
    10485760, -- 10MB limit per image
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'avatars', 
    'avatars', 
    true, 
    5242880, -- 5MB limit per avatar
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- 2. STORAGE POLICIES: product-media
-- Public visitors can read catalog images; Only administrators can upload/delete
-- =============================================================================
DROP POLICY IF EXISTS "product_media_public_read" ON storage.objects;
CREATE POLICY "product_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-media');

DROP POLICY IF EXISTS "product_media_admin_insert" ON storage.objects;
CREATE POLICY "product_media_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-media' AND (public.is_admin() OR auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "product_media_admin_update" ON storage.objects;
CREATE POLICY "product_media_admin_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-media' AND (public.is_admin() OR auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "product_media_admin_delete" ON storage.objects;
CREATE POLICY "product_media_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-media' AND (public.is_admin() OR auth.role() = 'service_role')
  );

-- =============================================================================
-- 3. STORAGE POLICIES: avatars
-- Public read; authenticated users can upload/manage only in their own folder
-- Path pattern: avatars/{user_id}/filename.ext
-- =============================================================================
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_user_insert" ON storage.objects;
CREATE POLICY "avatars_user_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND (
      auth.uid()::text = (storage.foldername(name))[1] 
      OR public.is_admin() 
      OR auth.role() = 'service_role'
    )
  );

DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND (
      auth.uid()::text = (storage.foldername(name))[1] 
      OR public.is_admin() 
      OR auth.role() = 'service_role'
    )
  );

DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;
CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND (
      auth.uid()::text = (storage.foldername(name))[1] 
      OR public.is_admin() 
      OR auth.role() = 'service_role'
    )
  );
