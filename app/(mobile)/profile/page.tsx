import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/profile";
import { getUserHostedEvents, getUserParticipatingEvents } from "@/lib/queries/events";
import { getInitials } from "@/lib/utils/format";
import { Calendar, Users, LogOut, Settings } from "lucide-react";
import { signOut } from "@/app/actions/auth";

/**
 * 프로필 페이지 (Server Component)
 *
 * 현재 사용자의 프로필 정보와 통계를 표시합니다.
 */
export default async function ProfilePage() {
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
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">프로필을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 3. 통계 정보
  const hostedEvents = await getUserHostedEvents(user.id);
  const participatingEvents = await getUserParticipatingEvents(user.id);

  return (
    <div className="space-y-6 pb-8">
      {/* 프로필 헤더 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username ?? ""} />
              <AvatarFallback className="text-2xl">{getInitials(profile.username)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="text-muted-foreground text-sm">{profile.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 만든 이벤트 수 */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Calendar className="text-primary mb-2 h-8 w-8" />
            <p className="text-3xl font-bold">{hostedEvents.length}</p>
            <p className="text-muted-foreground text-sm">만든 이벤트</p>
          </CardContent>
        </Card>

        {/* 참여한 이벤트 수 */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Users className="text-primary mb-2 h-8 w-8" />
            <p className="text-3xl font-bold">{participatingEvents.length}</p>
            <p className="text-muted-foreground text-sm">참여한 이벤트</p>
          </CardContent>
        </Card>
      </div>

      {/* 추가 정보 (Phase 3에서 확장 예정) */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h2 className="font-semibold">계정 정보</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">역할</span>
                <span className="font-medium">
                  {profile.role === "admin" ? "관리자" : "사용자"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">가입일</span>
                <span className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 수정 버튼 */}
      <Card>
        <CardContent className="pt-6">
          <Link href="/profile/edit">
            <Button variant="outline" className="w-full" size="lg">
              <Settings className="mr-2 h-5 w-5" />
              프로필 수정
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 로그아웃 버튼 */}
      <Card>
        <CardContent className="pt-6">
          <form action={signOut}>
            <Button type="submit" variant="destructive" className="w-full" size="lg">
              <LogOut className="mr-2 h-5 w-5" />
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
