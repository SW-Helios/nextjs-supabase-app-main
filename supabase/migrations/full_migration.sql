-- =============================================
-- Gather 앱 전체 마이그레이션 스크립트
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- =============================================
-- STEP 0: 기존 스키마 정리
-- =============================================
-- 1. 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
DROP TRIGGER IF EXISTS on_events_updated ON public.events;
DROP TRIGGER IF EXISTS on_event_created ON public.events;
DROP TRIGGER IF EXISTS on_participant_insert ON public.event_participants;

-- 2. 함수 삭제
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_event();
DROP FUNCTION IF EXISTS public.check_participant_limit();
DROP FUNCTION IF EXISTS public.generate_invite_code(INTEGER);

-- 3. 인덱스 삭제
DROP INDEX IF EXISTS public.idx_events_created_by;
DROP INDEX IF EXISTS public.idx_events_invite_code;
DROP INDEX IF EXISTS public.idx_events_status;
DROP INDEX IF EXISTS public.idx_event_participants_event_id;
DROP INDEX IF EXISTS public.idx_event_participants_user_id;
DROP INDEX IF EXISTS public.idx_profiles_email;
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_profiles_created_at;
DROP INDEX IF EXISTS public.idx_events_event_date;
DROP INDEX IF EXISTS public.idx_events_status_date;
DROP INDEX IF EXISTS public.idx_events_active;
DROP INDEX IF EXISTS public.idx_events_created_at;
DROP INDEX IF EXISTS public.idx_event_participants_event_role;
DROP INDEX IF EXISTS public.idx_event_participants_joined_at;

-- 4. RLS 정책 삭제 (기존)
DROP POLICY IF EXISTS "프로필 조회는 모든 사용자 가능" ON public.profiles;
DROP POLICY IF EXISTS "본인 프로필만 수정 가능" ON public.profiles;
DROP POLICY IF EXISTS "본인 프로필만 삽입 가능" ON public.profiles;
DROP POLICY IF EXISTS "이벤트 조회는 모든 사용자 가능" ON public.events;
DROP POLICY IF EXISTS "인증된 사용자만 이벤트 생성 가능" ON public.events;
DROP POLICY IF EXISTS "이벤트 생성자만 수정 가능" ON public.events;
DROP POLICY IF EXISTS "이벤트 생성자만 삭제 가능" ON public.events;
DROP POLICY IF EXISTS "참여자 목록 조회는 모든 사용자 가능" ON public.event_participants;
DROP POLICY IF EXISTS "인증된 사용자만 참여 가능" ON public.event_participants;
DROP POLICY IF EXISTS "본인 참여 정보만 삭제 가능" ON public.event_participants;

-- 4-1. RLS 정책 삭제 (새로운 정책명)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "events_select_all" ON public.events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_update_owner" ON public.events;
DROP POLICY IF EXISTS "events_delete_owner_or_admin" ON public.events;
DROP POLICY IF EXISTS "participants_select_all" ON public.event_participants;
DROP POLICY IF EXISTS "participants_insert_own" ON public.event_participants;
DROP POLICY IF EXISTS "participants_update_host" ON public.event_participants;
DROP POLICY IF EXISTS "participants_delete_own_or_host" ON public.event_participants;

-- 5. 테이블 삭제
DROP TABLE IF EXISTS public.event_participants CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =============================================
-- STEP 1: profiles 테이블 생성
-- =============================================
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

COMMENT ON TABLE public.profiles IS '사용자 프로필 정보';
COMMENT ON COLUMN public.profiles.id IS 'auth.users 테이블의 ID 참조';
COMMENT ON COLUMN public.profiles.role IS '사용자 역할 (user, admin)';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: events 테이블 생성
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
  max_participants INTEGER DEFAULT 30 CHECK (max_participants > 0 AND max_participants <= 100),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.events IS '이벤트/모임 정보';
COMMENT ON COLUMN public.events.max_participants IS '최대 참여자 수 (기본 30명, 최대 100명)';

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 3: event_participants 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, user_id)
);

COMMENT ON TABLE public.event_participants IS '이벤트 참여자 관계';

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: RLS 정책 설정
-- =============================================

-- profiles 정책
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- events 정책
CREATE POLICY "events_select_all" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert_authenticated" ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "events_update_owner" ON public.events FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "events_delete_owner_or_admin" ON public.events FOR DELETE USING (
  auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- event_participants 정책
CREATE POLICY "participants_select_all" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "participants_insert_own" ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participants_update_host" ON public.event_participants FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
);
CREATE POLICY "participants_delete_own_or_host" ON public.event_participants FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
);

-- =============================================
-- STEP 5: 인덱스 생성
-- =============================================

-- profiles 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- events 인덱스
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_invite_code ON public.events(invite_code);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_status_date ON public.events(status, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(event_date DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

-- event_participants 인덱스
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_role ON public.event_participants(event_id, role);
CREATE INDEX IF NOT EXISTS idx_event_participants_joined_at ON public.event_participants(joined_at DESC);

-- =============================================
-- STEP 6: 함수 및 트리거 생성
-- =============================================

-- 초대 코드 생성 함수
CREATE OR REPLACE FUNCTION public.generate_invite_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles updated_at 트리거
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- events updated_at 트리거
CREATE TRIGGER on_events_updated
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 신규 사용자 프로필 자동 생성 함수
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

-- 신규 사용자 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 이벤트 생성 시 호스트 자동 추가 함수
CREATE OR REPLACE FUNCTION public.handle_new_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.event_participants (event_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'host')
  ON CONFLICT (event_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 이벤트 생성 트리거
CREATE TRIGGER on_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_event();

-- 참여자 수 검증 함수
CREATE OR REPLACE FUNCTION public.check_participant_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count FROM public.event_participants WHERE event_id = NEW.event_id;
  SELECT max_participants INTO max_count FROM public.events WHERE id = NEW.event_id;
  IF current_count >= max_count THEN
    RAISE EXCEPTION '이벤트 최대 참여자 수(%)를 초과했습니다.', max_count;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 참여자 수 검증 트리거
CREATE TRIGGER on_participant_insert
  BEFORE INSERT ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.check_participant_limit();

-- =============================================
-- 완료!
-- =============================================
-- 이제 Storage 버킷은 Supabase 대시보드에서 직접 생성하세요:
-- 1. Storage 메뉴로 이동
-- 2. 'event-covers' 버킷 생성 (Public, 5MB 제한)
-- 3. 'avatars' 버킷 생성 (Public, 2MB 제한)
