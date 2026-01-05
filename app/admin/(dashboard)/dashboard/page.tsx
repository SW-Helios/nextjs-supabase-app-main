import Link from "next/link";
import { Calendar, Users, Activity, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EventCard } from "@/components/events/event-card";
import { getDashboardMetrics } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils/format";

/**
 * 관리자 대시보드 페이지
 *
 * 주요 지표, 최근 이벤트, 최근 가입 사용자를 표시합니다.
 * Server Component로 실제 백엔드 데이터를 조회합니다.
 */
export default async function AdminDashboardPage() {
  // 대시보드 지표 조회
  const metrics = await getDashboardMetrics();

  // Supabase 클라이언트 생성
  const supabase = await createClient();

  // 최근 이벤트 3개 조회 (호스트 정보 포함)
  const { data: recentEventsData } = await supabase
    .from("events")
    .select(
      `
      *,
      host:profiles!events_created_by_fkey(id, full_name, avatar_url)
    `
    )
    .order("created_at", { ascending: false })
    .limit(3);

  // 각 이벤트의 참여자 수 조회
  const recentEvents = await Promise.all(
    (recentEventsData || []).map(async (event) => {
      const { count } = await supabase
        .from("event_participants")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);

      return {
        ...event,
        host: Array.isArray(event.host) ? event.host[0] : event.host,
        participant_count: count ?? 0,
      };
    })
  );

  // 최근 가입 사용자 3명 조회
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div className="space-y-8">
      {/* 페이지 제목 */}
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">관리자 주요 지표와 최근 활동을 확인하세요</p>
      </div>

      {/* KPI 카드 Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="총 이벤트"
          value={metrics.total_events}
          icon={Calendar}
          unit="개"
          change={metrics.week_events}
        />
        <StatCard
          title="총 사용자"
          value={metrics.total_users}
          icon={Users}
          unit="명"
          change={metrics.week_users}
        />
        <StatCard title="평균 참여자" value={metrics.avg_participants} icon={Activity} unit="명" />
        <StatCard title="이번 달 신규" value={metrics.month_events} icon={TrendingUp} unit="개" />
      </div>

      {/* 하단 Grid: 최근 이벤트 + 최근 가입 사용자 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 최근 이벤트 섹션 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>최근 이벤트</CardTitle>
            <Link href="/admin/events">
              <Button variant="ghost" size="sm">
                모두 보기
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <EventCard key={event.id} event={event} variant="compact" showStatus />
              ))
            ) : (
              <p className="text-muted-foreground text-sm">최근 이벤트가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 최근 가입 사용자 섹션 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>최근 가입 사용자</CardTitle>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                모두 보기
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentUsers && recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? ""} />
                    <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-muted-foreground text-xs">{user.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">최근 가입한 사용자가 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
