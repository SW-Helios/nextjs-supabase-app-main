-- =============================================
-- event_participants 테이블 생성 마이그레이션
-- 이벤트 참여자 관계를 저장하는 테이블
-- =============================================

-- event_participants 테이블 생성
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- 테이블 코멘트 추가
COMMENT ON TABLE public.event_participants IS '이벤트 참여자 관계';
COMMENT ON COLUMN public.event_participants.id IS '참여 기록 고유 ID';
COMMENT ON COLUMN public.event_participants.event_id IS '이벤트 ID';
COMMENT ON COLUMN public.event_participants.user_id IS '참여자 ID';
COMMENT ON COLUMN public.event_participants.role IS '참여자 역할 (host, participant)';
COMMENT ON COLUMN public.event_participants.joined_at IS '참여 일시';

-- RLS 활성화
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- event_participants 테이블 생성 완료
