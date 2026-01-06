"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateEventStatusAction } from "@/app/actions/events";
import { showSuccess, showError } from "@/lib/utils/toast";

/**
 * 이벤트 상태 배지 Props
 */
interface EventStatusBadgeProps {
  eventId: string;
  status: "active" | "completed" | "cancelled";
  /** 호스트 또는 관리자인 경우 true */
  canChangeStatus: boolean;
}

/**
 * 클릭 가능한 이벤트 상태 배지 컴포넌트
 *
 * 호스트 또는 관리자만 클릭하여 상태를 변경할 수 있습니다.
 * 클릭 시 확인 다이얼로그가 표시됩니다.
 */
export function EventStatusBadge({ eventId, status, canChangeStatus }: EventStatusBadgeProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 상태별 배지 스타일 및 텍스트
  const getStatusConfig = (currentStatus: string) => {
    switch (currentStatus) {
      case "active":
        return {
          variant: "default" as const,
          text: "진행 중",
          nextStatus: "completed" as const,
          nextText: "종료",
        };
      case "completed":
        return {
          variant: "destructive" as const,
          text: "종료",
          nextStatus: "active" as const,
          nextText: "진행 중",
        };
      case "cancelled":
        return {
          variant: "outline" as const,
          text: "취소됨",
          nextStatus: "active" as const,
          nextText: "진행 중",
        };
      default:
        return {
          variant: "outline" as const,
          text: "알 수 없음",
          nextStatus: "active" as const,
          nextText: "진행 중",
        };
    }
  };

  const config = getStatusConfig(status);

  // 상태 변경 핸들러
  const handleStatusChange = () => {
    startTransition(async () => {
      const result = await updateEventStatusAction(eventId, config.nextStatus);

      if (result.success) {
        showSuccess(result.message);
        setDialogOpen(false);
      } else {
        showError(result.message);
      }
    });
  };

  // 권한이 없으면 일반 배지로 표시
  if (!canChangeStatus) {
    return <Badge variant={config.variant}>{config.text}</Badge>;
  }

  return (
    <>
      {/* 클릭 가능한 배지 */}
      <Badge
        variant={config.variant}
        className="cursor-pointer transition-opacity hover:opacity-80"
        onClick={() => setDialogOpen(true)}
      >
        {config.text}
      </Badge>

      {/* 상태 변경 확인 다이얼로그 */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 상태 변경</AlertDialogTitle>
            <AlertDialogDescription>
              이벤트 상태를 &quot;{config.nextText}&quot;(으)로 변경하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>아니요</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleStatusChange} disabled={isPending}>
                {isPending ? "변경 중..." : "네"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
