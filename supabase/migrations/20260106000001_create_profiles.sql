-- =============================================
-- profiles 테이블 생성 마이그레이션
-- 사용자 프로필 정보를 저장하는 테이블
-- auth.users와 1:1 관계로 연결됩니다
-- =============================================

-- profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  website TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 테이블 코멘트 추가
COMMENT ON TABLE public.profiles IS '사용자 프로필 정보';
COMMENT ON COLUMN public.profiles.id IS 'auth.users 테이블의 ID 참조';
COMMENT ON COLUMN public.profiles.email IS '사용자 이메일';
COMMENT ON COLUMN public.profiles.full_name IS '사용자 이름';
COMMENT ON COLUMN public.profiles.username IS '고유 사용자명';
COMMENT ON COLUMN public.profiles.avatar_url IS '프로필 이미지 URL';
COMMENT ON COLUMN public.profiles.website IS '웹사이트 URL';
COMMENT ON COLUMN public.profiles.role IS '사용자 역할 (user, admin)';
COMMENT ON COLUMN public.profiles.created_at IS '생성 일시';
COMMENT ON COLUMN public.profiles.updated_at IS '수정 일시';

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- profiles 테이블 생성 완료
