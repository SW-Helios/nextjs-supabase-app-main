"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/utils/toast";
import { uploadCoverImageAction } from "@/app/actions/upload";
import type { UseFormReturn } from "react-hook-form";
import type { EventFormData } from "@/lib/schemas/event";

interface CoverImageUploadProps {
  form: UseFormReturn<EventFormData>;
  disabled?: boolean;
  initialImageUrl?: string;
}

/**
 * 커버 이미지 업로드 공통 컴포넌트
 *
 * 이벤트 생성/수정 폼에서 공통으로 사용하는 이미지 업로드 UI입니다.
 * - 이미지 미리보기
 * - 파일 선택 및 업로드
 * - 이미지 삭제
 * - 로딩 상태 표시
 */
export function CoverImageUpload({
  form,
  disabled = false,
  initialImageUrl,
}: CoverImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 업로드 관련 상태
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);

  // 파일 업로드 핸들러
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      showError("파일 크기가 너무 큽니다. 5MB 이하의 파일을 업로드해주세요.");
      return;
    }

    // 파일 타입 검증
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError("지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 형식만 가능합니다.");
      return;
    }

    try {
      setIsUploading(true);

      // 로컬 미리보기 생성
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);

      // FormData 생성 및 파일 추가
      const formData = new FormData();
      formData.append("file", file);

      // Server Action 호출
      const result = await uploadCoverImageAction(formData);

      if (result.success && result.data?.url) {
        // 업로드된 URL을 폼에 설정
        form.setValue("cover_image_url", result.data.url);
        showSuccess("이미지가 성공적으로 업로드되었습니다.");
      } else {
        // 업로드 실패 시 미리보기 제거
        setPreviewUrl(null);
        showError(result.message);
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      setPreviewUrl(null);
      showError("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // 이미지 삭제 핸들러
  const handleRemoveImage = () => {
    setPreviewUrl(null);
    form.setValue("cover_image_url", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isDisabled = disabled || isUploading;

  return (
    <div className="space-y-4">
      {/* 미리보기 영역 */}
      {previewUrl ? (
        <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg border">
          <Image src={previewUrl} alt="커버 이미지 미리보기" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
            disabled={isDisabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* 업로드 버튼 영역 */
        <div className="border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors">
          <ImageIcon className="text-muted-foreground mb-4 h-12 w-12" />
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">JPEG, PNG, WebP 형식 (최대 5MB)</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  이미지 선택
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={isDisabled}
        className="hidden"
      />
    </div>
  );
}
