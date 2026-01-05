import Image from "next/image";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Calendar, MapPin, Users, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EventActionButtons } from "@/components/events/event-action-buttons";
import { getEventDetail, isUserHost } from "@/lib/queries/events";
import { formatDate, getInitials } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/server";
import type { ParticipantWithUser } from "@/lib/types/models";

/**
 * 이벤트 상세 페이지 (Server Component)
 *
 * 이벤트의 모든 정보를 표시하고, 호스트인 경우 수정/공유/삭제 버튼을 제공합니다.
 */
export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15: params는 Promise 타입
  const { id } = await params;

  // 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 이벤트 데이터 조회
  const event = await getEventDetail(id);

  // 이벤트가 없으면 404 페이지로 처리
  if (!event) {
    notFound();
  }

  // 현재 사용자가 호스트인지 확인
  const isHost = await isUserHost(user.id, id);

  // 상태별 배지
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="default">예정</Badge>;
      case "ongoing":
        return <Badge variant="secondary">진행 중</Badge>;
      case "ended":
        return <Badge variant="outline">종료</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 커버 이미지 */}
      {event.cover_image_url && (
        <div className="relative h-64 w-full overflow-hidden rounded-lg">
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* 제목 및 상태 */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {getStatusBadge(event.status)}
        </div>
        {event.description && <p className="text-muted-foreground">{event.description}</p>}
      </div>

      {/* 호스트만 보이는 액션 버튼 */}
      {isHost && (
        <div className="flex gap-2">
          <Link href={`/events/${id}/edit`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Edit className="mr-2 h-4 w-4" />
              수정
            </Button>
          </Link>
          <EventActionButtons
            eventId={id}
            eventTitle={event.title}
            inviteCode={event.invite_code}
          />
        </div>
      )}

      {/* 이벤트 정보 카드 */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start gap-3">
            <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
            <div>
              <p className="text-muted-foreground text-sm">날짜 및 시간</p>
              <p className="font-medium">{formatDate(event.event_date)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="text-muted-foreground mt-0.5 h-5 w-5" />
            <div>
              <p className="text-muted-foreground text-sm">장소</p>
              <p className="font-medium">{event.location}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="text-muted-foreground mt-0.5 h-5 w-5" />
            <div>
              <p className="text-muted-foreground text-sm">참여자</p>
              <p className="font-medium">{event.participant_count}명 참여</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 초대 코드 카드 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">초대 코드</p>
            <div className="flex items-center gap-2">
              <code className="bg-muted flex-1 rounded-md px-3 py-2 font-mono text-sm">
                {event.invite_code}
              </code>
            </div>
            <p className="text-muted-foreground text-xs">이 코드로 다른 사람을 초대할 수 있어요</p>
          </div>
        </CardContent>
      </Card>

      {/* 참여자 목록 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h2 className="font-semibold">참여자 목록</h2>
            <div className="space-y-3">
              {event.participants.map((participant: ParticipantWithUser) => (
                <div key={participant.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={participant.user.avatar_url ?? undefined}
                        alt={participant.user.username ?? ""}
                      />
                      <AvatarFallback>{getInitials(participant.user.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.user.username}</p>
                    </div>
                  </div>
                  {participant.role === "host" && <Badge variant="secondary">호스트</Badge>}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
