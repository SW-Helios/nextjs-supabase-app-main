import { AdminSidebar } from "@/components/navigation/admin-sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * 관리자 대시보드 레이아웃
 *
 * 서버 측에서 관리자 권한을 검증합니다 (2차 보안 레이어)
 *
 * 접근 제어 시나리오:
 * 1. 미인증 사용자 → /admin/login 리다이렉트
 * 2. 일반 사용자 (인증됨, role !== 'admin') → / 리다이렉트
 * 3. 관리자 사용자 (role === 'admin') → 정상 접근
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 시나리오 1: 미인증 사용자 → /admin/login 리다이렉트
  if (!user) {
    redirect("/admin/login");
  }

  // 프로필에서 관리자 권한 확인
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // 시나리오 2: 일반 사용자 (인증됨, role !== 'admin') → / 리다이렉트
  if (error || profile?.role !== "admin") {
    redirect("/");
  }

  // 시나리오 3: 관리자 사용자 → 정상 접근
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-gray-50 p-8 dark:bg-gray-900">{children}</main>
    </div>
  );
}
