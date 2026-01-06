-- =============================================
-- event_comments 테이블 생성 마이그레이션
-- 이벤트 댓글 기능을 위한 테이블, RLS 정책, Storage 버킷을 생성합니다
-- =============================================

-- 1. event_comments 테이블 생성
CREATE TABLE IF NOT EXISTS public.event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON public.event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_user_id ON public.event_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_created_at ON public.event_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_comments_event_created ON public.event_comments(event_id, created_at DESC);

-- 3. RLS 활성화
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성

-- SELECT: 모든 사용자가 댓글 조회 가능
CREATE POLICY "comments_select_all"
  ON public.event_comments
  FOR SELECT
  USING (true);

-- INSERT: 인증된 사용자만 본인 댓글 생성 가능
CREATE POLICY "comments_insert_authenticated"
  ON public.event_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 작성자 본인만 수정 가능
CREATE POLICY "comments_update_own"
  ON public.event_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: 작성자 본인 또는 관리자만 삭제 가능
CREATE POLICY "comments_delete_own_or_admin"
  ON public.event_comments
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. updated_at 자동 갱신 트리거
CREATE TRIGGER update_event_comments_updated_at
  BEFORE UPDATE ON public.event_comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- 6. comment-images Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comment-images',
  'comment-images',
  true,
  3145728,  -- 3MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heif', 'image/heic', 'image/bmp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 7. comment-images 버킷 RLS 정책

-- 조회: 모든 사용자 가능
CREATE POLICY "comment_images_select_all"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'comment-images');

-- 업로드: 인증된 사용자만 가능
CREATE POLICY "comment_images_insert_authenticated"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'comment-images'
    AND auth.role() = 'authenticated'
  );

-- 삭제: 파일 소유자만 가능 (폴더 구조: {user_id}/{filename})
CREATE POLICY "comment_images_delete_owner"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'comment-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
