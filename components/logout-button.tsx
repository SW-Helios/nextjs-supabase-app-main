"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // 전체 페이지 새로고침으로 서버 컴포넌트 재렌더링
    window.location.href = "/";
  };

  return (
    <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
      <LogOut className="h-4 w-4" />
      <span className="text-sm">로그아웃</span>
    </Button>
  );
}
