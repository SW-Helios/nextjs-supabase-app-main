-- =============================================
-- event_participants 테이블에 participant_name 컬럼 추가
-- 고정 참여자 지원을 위한 마이그레이션
-- =============================================

-- 1. user_id를 NULL 허용으로 변경
ALTER TABLE public.event_participants
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. participant_name 컬럼 추가 (고정 참여자 이름 저장용)
ALTER TABLE public.event_participants
  ADD COLUMN participant_name TEXT;

-- 3. 제약 조건 추가: user_id 또는 participant_name 중 하나는 반드시 있어야 함
ALTER TABLE public.event_participants
  ADD CONSTRAINT check_user_or_participant_name
  CHECK (
    (user_id IS NOT NULL AND participant_name IS NULL) OR
    (user_id IS NULL AND participant_name IS NOT NULL)
  );

-- 4. 기존 UNIQUE 제약 조건 삭제
ALTER TABLE public.event_participants
  DROP CONSTRAINT IF EXISTS event_participants_event_id_user_id_key;

-- 5. 새로운 UNIQUE 제약 조건 추가
-- 실제 사용자의 경우: event_id + user_id 조합이 유니크
CREATE UNIQUE INDEX event_participants_event_user_unique
  ON public.event_participants(event_id, user_id)
  WHERE user_id IS NOT NULL;

-- 고정 참여자의 경우: event_id + participant_name 조합이 유니크
CREATE UNIQUE INDEX event_participants_event_name_unique
  ON public.event_participants(event_id, participant_name)
  WHERE participant_name IS NOT NULL;

-- 6. 컬럼 코멘트 추가
COMMENT ON COLUMN public.event_participants.participant_name IS '고정 참여자 이름 (user_id가 NULL인 경우 사용)';
