-- Gather 앱 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- =============================================
-- 1. profiles 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  website TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- profiles 테이블 RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- profiles 정책: 모든 사용자가 프로필 조회 가능
CREATE POLICY "프로필 조회는 모든 사용자 가능" ON public.profiles
  FOR SELECT USING (true);

-- profiles 정책: 본인 프로필만 수정 가능
CREATE POLICY "본인 프로필만 수정 가능" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- profiles 정책: 본인 프로필만 삽입 가능
CREATE POLICY "본인 프로필만 삽입 가능" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. events 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  cover_image_url TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- events 테이블 RLS 활성화
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- events 정책: 모든 사용자가 이벤트 조회 가능
CREATE POLICY "이벤트 조회는 모든 사용자 가능" ON public.events
  FOR SELECT USING (true);

-- events 정책: 인증된 사용자만 이벤트 생성 가능
CREATE POLICY "인증된 사용자만 이벤트 생성 가능" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- events 정책: 이벤트 생성자만 수정 가능
CREATE POLICY "이벤트 생성자만 수정 가능" ON public.events
  FOR UPDATE USING (auth.uid() = created_by);

-- events 정책: 이벤트 생성자만 삭제 가능
CREATE POLICY "이벤트 생성자만 삭제 가능" ON public.events
  FOR DELETE USING (auth.uid() = created_by);

-- =============================================
-- 3. event_participants 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- event_participants 테이블 RLS 활성화
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- event_participants 정책: 모든 사용자가 참여자 목록 조회 가능
CREATE POLICY "참여자 목록 조회는 모든 사용자 가능" ON public.event_participants
  FOR SELECT USING (true);

-- event_participants 정책: 인증된 사용자만 참여 가능
CREATE POLICY "인증된 사용자만 참여 가능" ON public.event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- event_participants 정책: 본인 참여 정보만 삭제 가능
CREATE POLICY "본인 참여 정보만 삭제 가능" ON public.event_participants
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 4. 인덱스 생성
-- =============================================
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_invite_code ON public.events(invite_code);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);

-- =============================================
-- 5. 회원가입 시 자동 프로필 생성 트리거
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 6. updated_at 자동 갱신 트리거
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles updated_at 트리거
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- events updated_at 트리거
DROP TRIGGER IF EXISTS on_events_updated ON public.events;
CREATE TRIGGER on_events_updated
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 완료 메시지
-- =============================================
-- 스키마 생성 완료!
-- 이제 회원가입하면 자동으로 profiles 테이블에 사용자 정보가 생성됩니다.
