"use client";

import { useState, useRef, useActionState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createCommentAction } from "@/app/actions/comments";
import { uploadCommentImageAction } from "@/app/actions/upload";
import { showSuccess, showError } from "@/lib/utils/toast";
import type { ActionResult } from "@/lib/types/forms";

/**
 * 댓글 작성 폼 Props
 */
interface CommentFormProps {
  eventId: string;
}

/**
 * 댓글 작성 폼 컴포넌트
 *
 * 텍스트와 이미지(최대 3장)를 첨부할 수 있는 댓글 작성 폼입니다.
 */
export function CommentForm({ eventId }: CommentFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Server Action 바인딩
  const boundAction = createCommentAction.bind(null, eventId);

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prevState: ActionResult, formData: FormData) => {
      // 이미지 URL 배열 추가
      formData.set("image_urls", JSON.stringify(imageUrls));

      const result = await boundAction(_prevState, formData);

      if (result.success) {
        showSuccess(result.message);
        setContent("");
        setImageUrls([]);
        router.refresh();
      } else {
        showError(result.message);
      }

      return result;
    },
    { success: false, message: "" }
  );

  // 이미지 업로드 핸들러
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 최대 3장 제한
    if (imageUrls.length >= 3) {
      showError("이미지는 최대 3개까지 첨부 가능합니다.");
      return;
    }

    // 파일 크기 검증 (3MB)
    const MAX_FILE_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      showError("파일 크기가 너무 큽니다. 3MB 이하의 파일을 업로드해주세요.");
      return;
    }

    // 파일 타입 검증
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heif",
      "image/heic",
      "image/bmp",
    ];
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError("JPEG, PNG, WebP, HEIF, BMP 형식의 이미지만 업로드 가능합니다.");
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadCommentImageAction(formData);

      if (result.success && result.data?.url) {
        setImageUrls((prev) => [...prev, result.data!.url]);
        showSuccess("이미지가 업로드되었습니다.");
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      showError("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 이미지 삭제 핸들러
  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const isDisabled = isPending || isUploading;
  const canSubmit = content.trim().length > 0 || imageUrls.length > 0;

  return (
    <form action={formAction} className="space-y-3">
      {/* 이미지 미리보기 */}
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative h-20 w-20">
              <Image
                src={url}
                alt={`첨부 이미지 ${index + 1}`}
                fill
                className="rounded-md object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5"
                onClick={() => handleRemoveImage(index)}
                disabled={isDisabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 텍스트 입력 영역 */}
      <div className="flex gap-2">
        <Textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요"
          rows={2}
          maxLength={1000}
          disabled={isDisabled}
          className="flex-1 resize-none"
        />
      </div>

      {state.errors?.content && (
        <p className="text-destructive text-sm">{state.errors.content[0]}</p>
      )}

      {/* 버튼 영역 */}
      <div className="flex items-center justify-between">
        {/* 이미지 첨부 버튼 */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || imageUrls.length >= 3}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">{imageUrls.length}/3</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heif,image/heic,image/bmp,.heif,.heic,.bmp"
            onChange={handleImageUpload}
            disabled={isDisabled}
            className="hidden"
          />
        </div>

        {/* 제출 버튼 */}
        <Button type="submit" size="sm" disabled={isDisabled || !canSubmit}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="ml-1">작성</span>
        </Button>
      </div>
    </form>
  );
}
