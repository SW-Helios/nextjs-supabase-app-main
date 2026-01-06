-- =============================================
-- RLS (Row Level Security) 정책 마이그레이션
-- 모든 테이블에 대한 접근 제어 정책을 설정합니다
-- =============================================

-- =============================================
-- profiles 테이블 정책
-- =============================================

-- 프로필 조회: 모든 사용자 가능
CREATE POLICY "profiles_select_all"
  ON public.profiles
  FOR SELECT
  USING (true);

-- 프로필 삽입: 본인만 가능
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 프로필 수정: 본인만 가능
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 프로필 삭제: 관리자만 가능 (일반 사용자는 삭제 불가)
CREATE POLICY "profiles_delete_admin"
  ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- events 테이블 정책
-- =============================================

-- 이벤트 조회: 모든 사용자 가능
CREATE POLICY "events_select_all"
  ON public.events
  FOR SELECT
  USING (true);

-- 이벤트 생성: 인증된 사용자만 가능
CREATE POLICY "events_insert_authenticated"
  ON public.events
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- 이벤트 수정: 생성자만 가능
CREATE POLICY "events_update_owner"
  ON public.events
  FOR UPDATE
  USING (auth.uid() = created_by);

-- 이벤트 삭제: 생성자 또는 관리자만 가능
CREATE POLICY "events_delete_owner_or_admin"
  ON public.events
  FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- event_participants 테이블 정책
-- =============================================

-- 참여자 목록 조회: 모든 사용자 가능
CREATE POLICY "participants_select_all"
  ON public.event_participants
  FOR SELECT
  USING (true);

-- 참여 등록: 인증된 사용자가 본인만 등록 가능
CREATE POLICY "participants_insert_own"
  ON public.event_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 참여 정보 수정: 이벤트 호스트만 가능 (역할 변경 등)
CREATE POLICY "participants_update_host"
  ON public.event_participants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id AND created_by = auth.uid()
    )
  );

-- 참여 취소: 본인 또는 이벤트 호스트만 가능
CREATE POLICY "participants_delete_own_or_host"
  ON public.event_participants
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id AND created_by = auth.uid()
    )
  );

-- RLS 정책 설정 완료
