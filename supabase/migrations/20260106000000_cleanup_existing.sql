-- =============================================
-- 기존 스키마 정리 마이그레이션
-- 기존 테이블, 정책, 인덱스, 트리거, 함수를 모두 삭제합니다
-- =============================================

-- 1. 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
DROP TRIGGER IF EXISTS on_events_updated ON public.events;

-- 2. 함수 삭제
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- 3. 인덱스 삭제 (테이블 삭제 시 자동 삭제되지만 명시적으로 삭제)
DROP INDEX IF EXISTS public.idx_events_created_by;
DROP INDEX IF EXISTS public.idx_events_invite_code;
DROP INDEX IF EXISTS public.idx_events_status;
DROP INDEX IF EXISTS public.idx_event_participants_event_id;
DROP INDEX IF EXISTS public.idx_event_participants_user_id;

-- 4. RLS 정책 삭제
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

-- 5. 테이블 삭제 (의존성 순서대로)
DROP TABLE IF EXISTS public.event_participants CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 정리 완료 메시지
-- 기존 스키마가 모두 삭제되었습니다.
