-- =============================================
-- 관리자 역할 설정 마이그레이션
-- 특정 사용자에게 관리자 권한을 부여합니다
-- =============================================

-- 관리자 계정 설정 (bruce.lean17@gmail.com)
-- 이 쿼리는 해당 이메일의 사용자가 존재할 때만 실행됩니다
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'bruce.lean17@gmail.com';

-- 관리자 설정 확인 함수
CREATE OR REPLACE FUNCTION public.set_user_as_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'admin', updated_at = NOW()
  WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE NOTICE '해당 이메일의 사용자를 찾을 수 없습니다: %', user_email;
  ELSE
    RAISE NOTICE '관리자 권한이 부여되었습니다: %', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 관리자 권한 해제 함수
CREATE OR REPLACE FUNCTION public.revoke_admin_role(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'user', updated_at = NOW()
  WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE NOTICE '해당 이메일의 사용자를 찾을 수 없습니다: %', user_email;
  ELSE
    RAISE NOTICE '관리자 권한이 해제되었습니다: %', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 사용법:
-- SELECT public.set_user_as_admin('admin@example.com');
-- SELECT public.revoke_admin_role('admin@example.com');
-- =============================================

-- 현재 관리자 목록 조회
-- SELECT id, email, full_name, role FROM public.profiles WHERE role = 'admin';
