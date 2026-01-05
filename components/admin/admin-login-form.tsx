"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth/oauth";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * 관리자 로그인 폼 컴포넌트
 * 기존 LoginForm + SocialLoginButtons 로직을 재사용하되
 * 관리자 전용으로 리다이렉트 경로를 수정
 */
export function AdminLoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  /**
   * Google OAuth 로그인 핸들러
   * 관리자 대시보드로 리다이렉트하도록 설정
   */
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle("/admin/dashboard");
      if (error) throw error;
    } catch (error: unknown) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      showError(errorMessage);
      setIsGoogleLoading(false);
    }
  };

  /**
   * 이메일/비밀번호 로그인 핸들러
   * 실제 Supabase 인증 + 관리자 권한 확인
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Supabase 이메일/비밀번호 인증
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. profiles 테이블에서 role 조회
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. 관리자 권한 확인
      if (profile.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("관리자 권한이 없습니다");
      }

      // 4. 로그인 성공
      showSuccess("로그인되었습니다");
      router.push("/admin/dashboard");
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error);
      showError(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">관리자 로그인</CardTitle>
          <CardDescription>관리자 계정으로 로그인하여 대시보드에 접근하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              {/* Google OAuth 버튼 */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
                {isGoogleLoading ? "Google 연결 중..." : "Google로 계속하기"}
              </Button>

              {/* 구분선 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background text-muted-foreground px-2">또는</span>
                </div>
              </div>

              {/* 이메일 필드 */}
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@gather.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* 비밀번호 필드 */}
              <div className="grid gap-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* 에러 메시지 */}
              {error && <p className="text-sm text-red-500">{error}</p>}

              {/* 제출 버튼 */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
