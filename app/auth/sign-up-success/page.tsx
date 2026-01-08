"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // 카운트다운 타이머
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 5초 후 홈으로 리다이렉트
    const redirect = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">회원가입 완료!</CardTitle>
              <CardDescription>이메일을 확인해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                회원가입이 완료되었습니다. 이메일로 전송된 확인 링크를 클릭하여 계정을
                활성화해주세요.
              </p>
              <p className="text-muted-foreground text-sm">
                {countdown}초 후 홈 화면으로 이동합니다...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
