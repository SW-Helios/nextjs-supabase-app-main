import { AdminLoginForm } from "@/components/admin/admin-login-form";

/**
 * 관리자 로그인 페이지
 *
 * Google OAuth 및 이메일/비밀번호 로그인을 지원
 * 성공 시 /admin/dashboard로 리다이렉트
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AdminLoginForm />
      </div>
    </div>
  );
}
