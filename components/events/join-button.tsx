"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/utils/toast";
import { joinEventByInviteCodeAction } from "@/app/actions/events";

interface JoinButtonProps {
  inviteCode: string;
  eventTitle: string;
}

/**
 * 이벤트 참여 버튼 (Client Component)
 *
 * 초대 코드를 사용하여 이벤트에 참여하고 성공 시 이벤트 상세 페이지로 이동합니다.
 */
export function JoinButton({ inviteCode, eventTitle }: JoinButtonProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  /**
   * 이벤트 참여 처리
   */
  const handleJoin = async () => {
    try {
      setIsJoining(true);

      // 실제 Server Action 호출
      const result = await joinEventByInviteCodeAction(inviteCode);

      // 실패 처리
      if (!result.success) {
        showError(result.message);
        setIsJoining(false);
        return;
      }

      // 성공 처리
      showSuccess(result.message);
      router.refresh(); // Server Component 재검증
      router.push(`/events/${result.data?.eventId}`);
    } catch (error) {
      console.error("Failed to join event:", error);
      showError("이벤트 참여 중 오류가 발생했습니다.");
      setIsJoining(false);
    }
  };

  return (
    <Button
      onClick={handleJoin}
      disabled={isJoining}
      className="w-full"
      size="lg"
      aria-label={`${eventTitle} 이벤트에 참여하기`}
    >
      {isJoining ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          참여 중...
        </>
      ) : (
        "참여하기"
      )}
    </Button>
  );
}
