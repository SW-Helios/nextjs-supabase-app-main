-- =============================================
-- 함수 및 트리거 생성 마이그레이션
-- 자동화 로직을 위한 함수와 트리거를 설정합니다
-- =============================================

-- =============================================
-- 1. 초대 코드 생성 함수
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_invite_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 혼동 가능한 문자 제외 (0, O, I, 1)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION public.generate_invite_code IS '고유한 초대 코드 생성 (혼동 가능한 문자 제외)';

-- =============================================
-- 2. updated_at 자동 갱신 함수
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_updated_at IS 'updated_at 필드 자동 갱신';

-- profiles 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- events 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS on_events_updated ON public.events;
CREATE TRIGGER on_events_updated
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 3. 신규 사용자 프로필 자동 생성 함수
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

COMMENT ON FUNCTION public.handle_new_user IS '회원가입 시 자동으로 profiles 테이블에 레코드 생성';

-- 신규 사용자 트리거 설정
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 4. 이벤트 생성 시 호스트 자동 추가 함수
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_event()
RETURNS TRIGGER AS $$
BEGIN
  -- 이벤트 생성자를 호스트로 자동 추가
  INSERT INTO public.event_participants (event_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'host')
  ON CONFLICT (event_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_event IS '이벤트 생성 시 생성자를 호스트로 자동 추가';

-- 이벤트 생성 트리거 설정
DROP TRIGGER IF EXISTS on_event_created ON public.events;
CREATE TRIGGER on_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_event();

-- =============================================
-- 5. 참여자 수 검증 함수
-- =============================================
CREATE OR REPLACE FUNCTION public.check_participant_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  -- 현재 참여자 수 조회
  SELECT COUNT(*) INTO current_count
  FROM public.event_participants
  WHERE event_id = NEW.event_id;

  -- 최대 참여자 수 조회
  SELECT max_participants INTO max_count
  FROM public.events
  WHERE id = NEW.event_id;

  -- 최대 참여자 수 초과 시 에러
  IF current_count >= max_count THEN
    RAISE EXCEPTION '이벤트 최대 참여자 수(%)를 초과했습니다.', max_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_participant_limit IS '이벤트 참여자 수 제한 검증';

-- 참여자 수 검증 트리거
DROP TRIGGER IF EXISTS on_participant_insert ON public.event_participants;
CREATE TRIGGER on_participant_insert
  BEFORE INSERT ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.check_participant_limit();

-- 함수 및 트리거 설정 완료
