/**
 * 프로필 수정 페이지 (Server Component)
 *
 * 사용자가 자신의 프로필 정보를 수정할 수 있는 페이지입니다.
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/profile";
import { ProfileEditForm } from "@/components/profile-edit-form";

/**
 * 프로필 수정 페이지
 */
export default async function EditProfilePage() {
  // 1. 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2. 프로필 조회
  const profile = await getUserProfile(user.id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">프로필 수정</h1>
          <p className="text-muted-foreground text-sm">프로필 정보를 수정하세요</p>
        </div>
      </div>

      {/* 프로필 수정 폼 */}
      <ProfileEditForm profile={profile} />
    </div>
  );
}
