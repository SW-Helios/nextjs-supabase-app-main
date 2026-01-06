import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ParticipantCardProps } from "@/lib/types/components";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/format";

/**
 * 참여자 카드 컴포넌트
 *
 * 참여자 정보를 카드 형태로 표시합니다.
 * sm, md, lg 세 가지 size를 지원합니다.
 *
 * @param participant - 표시할 참여자 정보 (사용자 정보 포함)
 * @param showRole - 역할 표시 여부 (기본값: true)
 * @param size - 카드 크기 (기본값: 'md')
 */
export function ParticipantCard({
  participant,
  showRole = true,
  size = "md",
}: ParticipantCardProps) {
  // 역할 배지
  const getRoleBadge = (role: string) => {
    if (role === "host") {
      return (
        <Badge variant="default" className="text-xs">
          호스트
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        참여자
      </Badge>
    );
  };

  // Size별 스타일
  const sizeStyles = {
    sm: {
      container: "gap-2 p-2",
      avatar: "h-8 w-8",
      avatarText: "text-xs",
      name: "text-sm",
      role: "text-xs",
    },
    md: {
      container: "gap-3 p-3",
      avatar: "h-10 w-10",
      avatarText: "text-sm",
      name: "text-base",
      role: "text-sm",
    },
    lg: {
      container: "gap-4 p-4",
      avatar: "h-12 w-12",
      avatarText: "text-base",
      name: "text-lg",
      role: "text-base",
    },
  };

  const styles = sizeStyles[size];

  // 고정 참여자인 경우 participant_name 사용, 실제 사용자인 경우 user 정보 사용
  const displayName = participant.participant_name || participant.user?.username || "알 수 없음";
  const avatarUrl = participant.user?.avatar_url ?? undefined;

  return (
    <div
      className={cn(
        "bg-card hover:bg-accent flex items-center rounded-lg border transition-colors",
        styles.container
      )}
    >
      {/* 아바타 */}
      <Avatar className={styles.avatar}>
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className={styles.avatarText}>{getInitials(displayName)}</AvatarFallback>
      </Avatar>

      {/* 정보 */}
      <div className="flex flex-1 items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-medium", styles.name)}>{displayName}</p>
          {showRole && (
            <p className={cn("text-muted-foreground", styles.role)}>
              {participant.role === "host" ? "호스트" : "참여자"}
            </p>
          )}
        </div>

        {/* 역할 배지 (md, lg 사이즈에서만 표시) */}
        {showRole && size !== "sm" && getRoleBadge(participant.role)}
      </div>
    </div>
  );
}
