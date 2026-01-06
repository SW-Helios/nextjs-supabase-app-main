-- =============================================
-- Storage 버킷 생성 마이그레이션
-- 이미지 파일 저장을 위한 Storage 버킷을 설정합니다
-- =============================================

-- =============================================
-- 1. event-covers 버킷 (이벤트 커버 이미지)
-- =============================================

-- 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true,  -- 공개 버킷 (누구나 조회 가능)
  5242880,  -- 5MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- event-covers 버킷 RLS 정책

-- 조회: 모든 사용자 가능
CREATE POLICY "event_covers_select_all"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-covers');

-- 업로드: 인증된 사용자만 가능
CREATE POLICY "event_covers_insert_authenticated"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'event-covers'
    AND auth.role() = 'authenticated'
  );

-- 수정: 파일 소유자만 가능 (owner 필드 기준)
CREATE POLICY "event_covers_update_owner"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'event-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 삭제: 파일 소유자만 가능
CREATE POLICY "event_covers_delete_owner"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'event-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- 2. avatars 버킷 (사용자 프로필 이미지)
-- =============================================

-- 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- 공개 버킷
  2097152,  -- 2MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- avatars 버킷 RLS 정책

-- 조회: 모든 사용자 가능
CREATE POLICY "avatars_select_all"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- 업로드: 본인 폴더에만 가능 (폴더명 = user_id)
CREATE POLICY "avatars_insert_own"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 수정: 본인 폴더만 가능
CREATE POLICY "avatars_update_own"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 삭제: 본인 폴더만 가능
CREATE POLICY "avatars_delete_own"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage 버킷 설정 완료
--
-- 사용 예시:
-- event-covers: {user_id}/{event_id}/cover.jpg
-- avatars: {user_id}/avatar.jpg
