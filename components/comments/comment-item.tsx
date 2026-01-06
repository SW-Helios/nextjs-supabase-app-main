"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentEditForm } from "./comment-edit-form";
import { CommentDeleteDialog } from "./comment-delete-dialog";
import { deleteCommentAction } from "@/app/actions/comments";
import { formatRelativeTime } from "@/lib/utils/format";
import { getInitials } from "@/lib/utils/format";
import { showSuccess, showError } from "@/lib/utils/toast";
import type { CommentWithUser } from "@/lib/types/models";

/**
 * 댓글 아이템 Props
 */
interface CommentItemProps {
  comment: CommentWithUser;
  eventId: string;
  currentUserId?: string;
  isAdmin: boolean;
}

/**
 * 개별 댓글 컴포넌트
 *
 * 댓글 내용, 작성자 정보, 수정/삭제 메뉴를 표시합니다.
 * 작성자 본인 또는 관리자만 수정/삭제 가능합니다.
 */
export function CommentItem({ comment, eventId, currentUserId, isAdmin }: CommentItemProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 권한 확인: 작성자 본인 또는 관리자 (비로그인 시 모두 false)
  const isAuthor = currentUserId ? comment.user_id === currentUserId : false;
  const canModify = isAuthor; // 수정은 작성자만
  const canDelete = isAuthor || isAdmin; // 삭제는 작성자 또는 관리자

  // 삭제 핸들러
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCommentAction(comment.id, eventId);

      if (result.success) {
        showSuccess(result.message);
        setIsDeleteDialogOpen(false);
        router.refresh();
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      showError("댓글 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 수정 폼 표시 중일 때
  if (isEditing) {
    return (
      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={comment.user.avatar_url ?? undefined}
              alt={comment.user.username ?? ""}
            />
            <AvatarFallback className="text-xs">
              {getInitials(comment.user.username)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{comment.user.username || "알 수 없음"}</span>
        </div>
        <CommentEditForm
          commentId={comment.id}
          eventId={eventId}
          initialContent={comment.content}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="group space-y-2 rounded-lg border p-4">
        {/* 헤더: 작성자 정보 + 메뉴 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={comment.user.avatar_url ?? undefined}
                alt={comment.user.username ?? ""}
              />
              <AvatarFallback className="text-xs">
                {getInitials(comment.user.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-medium">{comment.user.username || "알 수 없음"}</span>
              <span className="text-muted-foreground ml-2 text-xs">
                {formatRelativeTime(comment.created_at)}
                {comment.updated_at !== comment.created_at && " (수정됨)"}
              </span>
            </div>
          </div>

          {/* 수정/삭제 메뉴 */}
          {(canModify || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">댓글 메뉴</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canModify && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    수정
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* 댓글 내용 */}
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

        {/* 첨부 이미지 */}
        {comment.image_urls && comment.image_urls.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {comment.image_urls.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative h-24 w-24 overflow-hidden rounded-md border"
              >
                <Image
                  src={url}
                  alt={`첨부 이미지 ${index + 1}`}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <CommentDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
