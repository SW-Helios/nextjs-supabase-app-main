-- =============================================
-- events 테이블에 좌표 필드 추가 마이그레이션
-- 네이버 지도 연동을 위한 위도/경도 컬럼을 추가합니다
-- =============================================

-- 1. latitude (위도), longitude (경도) 컬럼 추가
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. 좌표 기반 인덱스 생성 (좌표가 있는 경우만)
CREATE INDEX IF NOT EXISTS idx_events_coordinates
ON public.events(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. 컬럼 코멘트 추가
COMMENT ON COLUMN public.events.latitude IS '장소의 위도 좌표';
COMMENT ON COLUMN public.events.longitude IS '장소의 경도 좌표';
