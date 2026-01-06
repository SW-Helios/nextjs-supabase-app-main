-- =============================================
-- RLS INSERT 정책 수정 마이그레이션
-- 관리자가 모든 테이블에 데이터를 생성할 수 있도록 수정
-- =============================================

-- =============================================
-- profiles 테이블 INSERT 정책 수정
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- 새 정책: 본인 또는 관리자가 삽입 가능
CREATE POLICY "profiles_insert_own_or_admin"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- events 테이블 INSERT 정책 수정
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;

-- 새 정책: 본인이 생성자이거나 관리자인 경우 삽입 가능
CREATE POLICY "events_insert_authenticated_or_admin"
  ON public.events
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- event_participants 테이블 INSERT 정책 수정
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "participants_insert_own" ON public.event_participants;

-- 새 정책: 본인 등록 또는 관리자/이벤트 호스트가 삽입 가능
CREATE POLICY "participants_insert_own_or_host_or_admin"
  ON public.event_participants
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id AND created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- UPDATE 정책도 관리자 권한 추가
-- =============================================

-- profiles UPDATE 정책 수정
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- events UPDATE 정책 수정
DROP POLICY IF EXISTS "events_update_owner" ON public.events;

CREATE POLICY "events_update_owner_or_admin"
  ON public.events
  FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- event_participants UPDATE 정책 수정
DROP POLICY IF EXISTS "participants_update_host" ON public.event_participants;

CREATE POLICY "participants_update_host_or_admin"
  ON public.event_participants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id AND created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS 정책 수정 완료
