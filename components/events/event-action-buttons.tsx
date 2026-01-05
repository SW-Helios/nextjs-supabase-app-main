"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/events/share-dialog";
import { DeleteDialog } from "@/components/events/delete-dialog";
import { deleteEventAction } from "@/app/actions/events";
import { showSuccess, showError } from "@/lib/utils/toast";

interface EventActionButtonsProps {
  eventId: string;
  eventTitle: string;
  inviteCode: string;
}

/**
 * 이벤트 액션 버튼 (Client Component)
 *
 * 공유 및 삭제 버튼과 Dialog를 관리합니다.
 */
export function EventActionButtons({ eventId, eventTitle, inviteCode }: EventActionButtonsProps) {
  const router = useRouter();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 삭제 핸들러
  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Server Action 호출
      const result = await deleteEventAction(eventId);

      if (result.success) {
        showSuccess(result.message);
        setDeleteDialogOpen(false);
        // replace 사용 (히스토리에 남지 않도록) + refresh로 강제 리로드
        router.replace("/events");
        router.refresh();
      } else {
        showError(result.message);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("이벤트 삭제 실패:", error);
      showError("이벤트 삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
        <Share2 className="mr-2 h-4 w-4" />
        공유
      </Button>
      <Button variant="outline" onClick={() => setDeleteDialogOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        삭제
      </Button>

      {/* 공유 Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        inviteCode={inviteCode}
        eventTitle={eventTitle}
      />

      {/* 삭제 확인 Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        eventTitle={eventTitle}
        isDeleting={isDeleting}
      />
    </>
  );
}
