-- =============================================
-- events 테이블 생성 마이그레이션
-- 이벤트/모임 정보를 저장하는 테이블
-- =============================================

-- events 테이블 생성
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

-- 테이블 코멘트 추가
COMMENT ON TABLE public.events IS '이벤트/모임 정보';
COMMENT ON COLUMN public.events.id IS '이벤트 고유 ID';
COMMENT ON COLUMN public.events.title IS '이벤트 제목';
COMMENT ON COLUMN public.events.description IS '이벤트 설명';
COMMENT ON COLUMN public.events.event_date IS '이벤트 날짜/시간';
COMMENT ON COLUMN public.events.location IS '이벤트 장소';
COMMENT ON COLUMN public.events.cover_image_url IS '커버 이미지 URL';
COMMENT ON COLUMN public.events.invite_code IS '초대 코드 (고유)';
COMMENT ON COLUMN public.events.status IS '이벤트 상태 (active, cancelled, completed)';
COMMENT ON COLUMN public.events.max_participants IS '최대 참여자 수 (기본 30명, 최대 100명)';
COMMENT ON COLUMN public.events.created_by IS '이벤트 생성자 ID';
COMMENT ON COLUMN public.events.created_at IS '생성 일시';
COMMENT ON COLUMN public.events.updated_at IS '수정 일시';

-- RLS 활성화
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- events 테이블 생성 완료
