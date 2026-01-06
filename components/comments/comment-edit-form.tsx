"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateCommentAction } from "@/app/actions/comments";
import { showSuccess, showError } from "@/lib/utils/toast";
import type { ActionResult } from "@/lib/types/forms";

/**
 * 댓글 수정 폼 Props
 */
interface CommentEditFormProps {
  commentId: string;
  eventId: string;
  initialContent: string;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * 댓글 수정 폼 컴포넌트
 *
 * 기존 댓글 내용을 수정할 수 있는 인라인 폼입니다.
 */
export function CommentEditForm({
  commentId,
  eventId,
  initialContent,
  onCancel,
  onSuccess,
}: CommentEditFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);

  // Server Action 바인딩
  const boundAction = updateCommentAction.bind(null, commentId, eventId);

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prevState: ActionResult, formData: FormData) => {
      const result = await boundAction(_prevState, formData);

      if (result.success) {
        showSuccess(result.message);
        onSuccess();
        router.refresh();
      } else {
        showError(result.message);
      }

      return result;
    },
    { success: false, message: "" }
  );

  const handleCancel = () => {
    setContent(initialContent);
    onCancel();
  };

  return (
    <form action={formAction} className="space-y-3">
      <Textarea
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 입력하세요"
        rows={3}
        maxLength={1000}
        disabled={isPending}
        className="resize-none"
      />

      {state.errors?.content && (
        <p className="text-destructive text-sm">{state.errors.content[0]}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
        >
          취소
        </Button>
        <Button type="submit" size="sm" disabled={isPending || content.trim().length === 0}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              수정 중...
            </>
          ) : (
            "수정"
          )}
        </Button>
      </div>
    </form>
  );
}
