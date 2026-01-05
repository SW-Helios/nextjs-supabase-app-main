"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * 삭제 확인 Dialog Props
 */
interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  eventTitle: string;
  isDeleting?: boolean;
}

/**
 * 삭제 확인 Dialog 컴포넌트
 *
 * 이벤트 삭제 전 사용자 확인을 받는 Dialog입니다.
 * 경고 아이콘과 함께 이벤트 제목을 표시하여 실수를 방지합니다.
 */
export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  eventTitle,
  isDeleting = false,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-6 w-6" />
            <DialogTitle>이벤트 삭제</DialogTitle>
          </div>
          <DialogDescription>정말로 이벤트를 삭제하시겠습니까?</DialogDescription>
        </DialogHeader>

        <div className="bg-muted rounded-md p-4">
          <p className="text-muted-foreground text-sm">삭제할 이벤트:</p>
          <p className="mt-1 font-semibold">{eventTitle}</p>
        </div>

        <div className="border-destructive/50 bg-destructive/10 rounded-md border p-3">
          <p className="text-destructive text-sm">
            ⚠️ 이 작업은 되돌릴 수 없습니다. 모든 참여자 정보도 함께 삭제됩니다.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
