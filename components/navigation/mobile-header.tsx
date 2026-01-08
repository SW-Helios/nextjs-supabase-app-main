import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/profile";

/**
 * 모바일 헤더 컴포넌트 (Server Component)
 *
 * 로그인한 사용자의 닉네임 또는 이메일을 화면 상단에 표시합니다.
 * 비로그인 사용자에게는 헤더가 표시되지 않습니다.
 */
export async function MobileHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인 사용자는 헤더 표시 안 함
  if (!user) return null;

  // 프로필 정보 조회
  const profile = await getUserProfile(user.id);

  // 표시할 이름: 닉네임 > 프로필 이메일 > 인증 이메일
  const displayName = profile?.username || profile?.email || user.email;

  return (
    <header className="border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          안녕하세요, <span className="text-primary">{displayName}</span>님
        </span>
      </div>
    </header>
  );
}
