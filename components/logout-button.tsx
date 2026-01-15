"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
      <LogOut className="h-4 w-4" />
      <span className="text-sm">로그아웃</span>
    </Button>
  );
}
