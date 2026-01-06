-- =============================================
-- 인덱스 생성 마이그레이션
-- 쿼리 성능 최적화를 위한 인덱스를 설정합니다
-- =============================================

-- =============================================
-- profiles 테이블 인덱스
-- =============================================

-- 이메일 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles(email);

-- 역할별 검색 인덱스 (관리자 조회용)
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles(role);

-- 생성일 정렬 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles(created_at DESC);

-- =============================================
-- events 테이블 인덱스
-- =============================================

-- 생성자별 이벤트 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_events_created_by
  ON public.events(created_by);

-- 초대 코드 검색 인덱스 (고유 제약 조건으로 자동 생성되지만 명시적으로 추가)
CREATE INDEX IF NOT EXISTS idx_events_invite_code
  ON public.events(invite_code);

-- 상태별 필터링 인덱스
CREATE INDEX IF NOT EXISTS idx_events_status
  ON public.events(status);

-- 이벤트 날짜 정렬 인덱스 (다가오는 이벤트 조회용)
CREATE INDEX IF NOT EXISTS idx_events_event_date
  ON public.events(event_date DESC);

-- 복합 인덱스: 상태 + 날짜 (활성 이벤트 중 다가오는 순서)
CREATE INDEX IF NOT EXISTS idx_events_status_date
  ON public.events(status, event_date DESC);

-- 부분 인덱스: 활성 이벤트만 (자주 조회되는 데이터)
CREATE INDEX IF NOT EXISTS idx_events_active
  ON public.events(event_date DESC)
  WHERE status = 'active';

-- 생성일 정렬 인덱스
CREATE INDEX IF NOT EXISTS idx_events_created_at
  ON public.events(created_at DESC);

-- =============================================
-- event_participants 테이블 인덱스
-- =============================================

-- 이벤트별 참여자 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id
  ON public.event_participants(event_id);

-- 사용자별 참여 이벤트 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id
  ON public.event_participants(user_id);

-- 복합 인덱스: 이벤트 + 역할 (호스트 조회용)
CREATE INDEX IF NOT EXISTS idx_event_participants_event_role
  ON public.event_participants(event_id, role);

-- 참여 일시 정렬 인덱스
CREATE INDEX IF NOT EXISTS idx_event_participants_joined_at
  ON public.event_participants(joined_at DESC);

-- 인덱스 생성 완료
