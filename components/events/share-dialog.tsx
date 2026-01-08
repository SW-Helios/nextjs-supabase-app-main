"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { showSuccess } from "@/lib/utils/toast";

/**
 * 공유 Dialog Props
 */
interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode: string;
  eventTitle: string;
}

/**
 * 공유 Dialog 컴포넌트
 *
 * 이벤트 초대 링크를 클립보드에 복사할 수 있는 Dialog입니다.
 * 복사 성공 시 2초간 체크 아이콘을 표시합니다.
 */
export function ShareDialog({ open, onOpenChange, inviteCode, eventTitle }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  // 초대 URL 생성
  const inviteUrl =
    typeof window !== "undefined" ? `${window.location.origin}/invite/${inviteCode}` : "";

  // 클립보드 복사 핸들러
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      showSuccess("링크가 복사되었습니다!");

      // 2초 후 아이콘 원래대로
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>이벤트 공유</DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{eventTitle}</span> 이벤트에 친구를 초대하세요!
          </DialogDescription>
        </DialogHeader>

        {/* 초대 링크 */}
        <div>
          <label className="mb-2 block text-sm font-medium">초대 링크</label>
          <div className="flex items-center gap-2">
            <Input value={inviteUrl} readOnly className="font-mono text-sm" />
            <Button type="button" size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
