import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EventCard } from "@/components/events/event-card";
import { createClient } from "@/lib/supabase/server";
import {
  getUserHostedEvents,
  getUserParticipatingEvents,
  getActiveEvents,
} from "@/lib/queries/events";

/**
 * 이벤트 목록 페이지 (Server Component)
 *
 * 현재 사용자가 만든 이벤트와 참여한 이벤트를 표시합니다.
 */
export default async function EventsPage() {
  // A. 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (authError || !user) {
    redirect("/auth/login");
  }

  // B. 이벤트 데이터 조회
  const [hostedEventsWithHost, participatingEventsWithHost, activeEvents] = await Promise.all([
    getUserHostedEvents(user.id),
    getUserParticipatingEvents(user.id),
    getActiveEvents(20),
  ]);

  // 내가 만들거나 참여한 이벤트 ID 목록 (진행중인 이벤트에서 제외용)
  const myEventIds = new Set([
    ...hostedEventsWithHost.map((e) => e.id),
    ...participatingEventsWithHost.map((e) => e.id),
  ]);

  // 진행중인 이벤트에서 내 이벤트 제외
  const otherActiveEvents = activeEvents.filter((e) => !myEventIds.has(e.id));

  // 호스팅 이벤트가 있을 때만 FAB 표시
  const showFAB = hostedEventsWithHost.length > 0;

  return (
    <div className="space-y-8 pb-24">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">내 이벤트</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          참여하거나 호스팅하는 이벤트를 관리하세요
        </p>
      </div>

      {/* 내가 만든 이벤트 */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">내가 만든 이벤트</h2>
        {hostedEventsWithHost.length === 0 ? (
          <EmptyState
            title="아직 만든 이벤트가 없어요"
            description="새로운 이벤트를 만들어 사람들을 초대해보세요!"
            action={
              <Link href="/events/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  이벤트 만들기
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4">
            {hostedEventsWithHost.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <EventCard event={event} variant="compact" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 내가 참여한 이벤트 - 참여한 이벤트가 있을 때만 표시 */}
      {participatingEventsWithHost.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">내가 참여한 이벤트</h2>
          <div className="grid gap-4">
            {participatingEventsWithHost.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <EventCard event={event} variant="compact" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 진행중인 이벤트 (내 이벤트 제외) */}
      {otherActiveEvents.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">진행중인 이벤트</h2>
          <div className="grid gap-4">
            {otherActiveEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <EventCard event={event} variant="compact" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAB (Floating Action Button) - 하단 네비게이션 위 */}
      {/* 호스팅 이벤트가 있을 때만 표시 */}
      {showFAB && (
        <Link
          href="/events/new"
          className="fixed right-4 bottom-20 z-10"
          aria-label="이벤트 만들기"
        >
          <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      )}
    </div>
  );
}
