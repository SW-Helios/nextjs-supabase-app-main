import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 이벤트 카드 스켈레톤 컴포넌트
 *
 * EventCard 컴포넌트의 로딩 상태를 표시합니다.
 * 실제 EventCard와 동일한 레이아웃을 유지합니다.
 *
 * @param variant - 카드 표시 형태 (기본값: 'default')
 */
export function EventCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" }) {
  // Compact variant
  if (variant === "compact") {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* 썸네일 스켈레톤 */}
            <Skeleton className="h-20 w-20 flex-shrink-0 rounded-md" />

            {/* 정보 스켈레톤 */}
            <div className="flex flex-1 flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-4 w-1/2" />
              </div>

              {/* 하단 정보 스켈레톤 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="border-border bg-card overflow-hidden">
      {/* 커버 이미지 스켈레톤 */}
      <Skeleton className="h-48 w-full rounded-none" />

      <CardHeader className="space-y-2">
        {/* 제목과 상태 스켈레톤 */}
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-12" />
        </div>

        {/* 설명 스켈레톤 */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 날짜 및 장소 스켈레톤 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* 하단: 호스트 정보 및 참여자 수 스켈레톤 */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}
