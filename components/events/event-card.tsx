import Image from "next/image";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { EventCardProps } from "@/lib/types/components";
import { cn } from "@/lib/utils";
import { formatDate, getInitials } from "@/lib/utils/format";

/**
 * 이벤트 카드 컴포넌트
 *
 * 이벤트 정보를 카드 형태로 표시합니다.
 * default와 compact 두 가지 variant를 지원합니다.
 *
 * @param event - 표시할 이벤트 정보 (호스트 포함)
 * @param onClick - 카드 클릭 시 실행할 콜백 함수
 * @param showStatus - 이벤트 상태 표시 여부 (기본값: true)
 * @param variant - 카드 표시 형태 (기본값: 'default')
 */
export function EventCard({
  event,
  onClick,
  showStatus = true,
  variant = "default",
}: EventCardProps) {
  // 상태별 배지 색상
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

  // Compact variant
  if (variant === "compact") {
    return (
      <Card
        className={cn(
          onClick ? "cursor-pointer" : "",
          "transition-all hover:shadow-lg",
          "border-border bg-card"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* 썸네일 */}
            {event.cover_image_url && (
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                <Image
                  src={event.cover_image_url}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* 정보 */}
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 font-semibold">{event.title}</h3>
                  {showStatus && getStatusBadge(event.status)}
                </div>
                <div className="text-muted-foreground mt-1 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(event.event_date)}
                  </span>
                </div>
              </div>

              {/* 하단 정보 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={event.host.avatar_url ?? undefined}
                      alt={event.host.username ?? ""}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(event.host.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground text-sm">{event.host.username}</span>
                </div>
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Users className="h-3 w-3" />
                  {event.participant_count}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      className={cn(
        onClick ? "cursor-pointer" : "",
        "overflow-hidden transition-all hover:shadow-lg",
        "border-border bg-card"
      )}
      onClick={onClick}
    >
      {/* 커버 이미지 */}
      {event.cover_image_url && (
        <div className="relative h-48 w-full overflow-hidden">
          <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" />
        </div>
      )}

      <CardHeader className="space-y-2">
        {/* 제목과 상태 */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-lg font-semibold">{event.title}</h3>
          {showStatus && getStatusBadge(event.status)}
        </div>

        {/* 설명 */}
        {event.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">{event.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 날짜 및 장소 */}
        <div className="text-muted-foreground space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </div>

        {/* 하단: 호스트 정보 및 참여자 수 */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={event.host.avatar_url ?? undefined}
                alt={event.host.username ?? ""}
              />
              <AvatarFallback className="text-xs">
                {getInitials(event.host.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{event.host.username}</p>
              <p className="text-muted-foreground text-xs">호스트</p>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">{event.participant_count}명</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
