import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * 참여자 카드 스켈레톤 컴포넌트
 *
 * ParticipantCard 컴포넌트의 로딩 상태를 표시합니다.
 * 실제 ParticipantCard와 동일한 레이아웃을 유지합니다.
 *
 * @param size - 카드 크기 (기본값: 'md')
 */
export function ParticipantCardSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  // Size별 스타일
  const sizeStyles = {
    sm: {
      container: "gap-2 p-2",
      avatar: "h-8 w-8",
      name: "h-4 w-20",
      role: "h-3 w-12",
    },
    md: {
      container: "gap-3 p-3",
      avatar: "h-10 w-10",
      name: "h-4 w-24",
      role: "h-3 w-14",
    },
    lg: {
      container: "gap-4 p-4",
      avatar: "h-12 w-12",
      name: "h-5 w-28",
      role: "h-4 w-16",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className={cn("bg-card flex items-center rounded-lg border", styles.container)}>
      {/* 아바타 스켈레톤 */}
      <Skeleton className={cn(styles.avatar, "rounded-full")} />

      {/* 정보 스켈레톤 */}
      <div className="flex flex-1 items-center justify-between gap-2">
        <div className="flex-1 space-y-1">
          <Skeleton className={styles.name} />
          <Skeleton className={styles.role} />
        </div>

        {/* 배지 스켈레톤 (md, lg 사이즈) */}
        {size !== "sm" && <Skeleton className="h-5 w-12" />}
      </div>
    </div>
  );
}
