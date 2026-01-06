-- =============================================
-- 테스트 데이터 시드 마이그레이션
-- 개발/테스트용 샘플 데이터를 생성합니다
-- 주의: 프로덕션 환경에서는 실행하지 마세요!
-- =============================================

-- 테스트 사용자 프로필 (auth.users에 이미 존재하는 경우에만 작동)
-- 실제 테스트 시에는 먼저 Supabase Auth로 사용자를 생성해야 합니다

-- =============================================
-- 1. 테스트 이벤트 데이터 (profiles에 사용자가 있을 때 실행)
-- =============================================

-- 이벤트 생성 함수 (테스트용)
CREATE OR REPLACE FUNCTION public.seed_test_events()
RETURNS void AS $$
DECLARE
  host_id UUID;
  event_id UUID;
  i INTEGER;
BEGIN
  -- 첫 번째 사용자를 호스트로 사용 (있는 경우)
  SELECT id INTO host_id FROM public.profiles LIMIT 1;

  IF host_id IS NULL THEN
    RAISE NOTICE '프로필이 없어서 테스트 이벤트를 생성할 수 없습니다. 먼저 사용자를 생성하세요.';
    RETURN;
  END IF;

  -- 테스트 이벤트 5개 생성
  FOR i IN 1..5 LOOP
    INSERT INTO public.events (
      title,
      description,
      event_date,
      location,
      invite_code,
      status,
      max_participants,
      created_by
    ) VALUES (
      '테스트 이벤트 ' || i,
      '이것은 테스트 이벤트 ' || i || '의 설명입니다. Gather 앱에서 생성된 샘플 데이터입니다.',
      NOW() + (i * INTERVAL '7 days'),
      CASE i
        WHEN 1 THEN '서울 강남구 테헤란로 123'
        WHEN 2 THEN '서울 종로구 세종대로 100'
        WHEN 3 THEN '부산 해운대구 해운대로 200'
        WHEN 4 THEN '제주시 연동 300'
        ELSE '대전 유성구 대학로 400'
      END,
      public.generate_invite_code(),
      CASE WHEN i <= 4 THEN 'active' ELSE 'completed' END,
      CASE i
        WHEN 1 THEN 10
        WHEN 2 THEN 20
        WHEN 3 THEN 30
        WHEN 4 THEN 15
        ELSE 25
      END,
      host_id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE '테스트 이벤트 5개가 생성되었습니다.';
END;
$$ LANGUAGE plpgsql;

-- 시드 함수 실행
SELECT public.seed_test_events();

-- 시드 함수 삭제 (일회성)
DROP FUNCTION IF EXISTS public.seed_test_events();

-- =============================================
-- 테스트 데이터 시드 완료
-- =============================================
--
-- 참고사항:
-- 1. 이 마이그레이션은 profiles 테이블에 사용자가 있을 때만 이벤트를 생성합니다.
-- 2. 실제 테스트를 위해서는 먼저 Supabase Auth로 사용자를 생성하세요:
--    - gymcoding@gmail.com (일반 사용자)
--    - bruce.lean17@gmail.com (관리자)
-- 3. 프로덕션 배포 전에 이 마이그레이션 파일을 제거하거나 건너뛰세요.
