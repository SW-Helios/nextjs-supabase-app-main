"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types/forms";

/**
 * 커버 이미지 업로드 Server Action
 *
 * Supabase Storage의 'event-covers' 버킷에 이미지를 업로드합니다.
 * - 인증된 사용자만 업로드 가능
 * - 파일 크기: 최대 5MB
 * - 허용된 파일 타입: JPEG, PNG, WebP
 * - 파일명: 타임스탬프 + 원본 파일명으로 중복 방지
 *
 * @param formData - 업로드할 파일을 포함한 FormData ('file' 필드)
 * @returns 업로드된 이미지의 공개 URL 또는 에러 메시지
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', imageFile);
 * const result = await uploadCoverImageAction(formData);
 *
 * if (result.success) {
 *   console.log('업로드된 이미지 URL:', result.data?.url);
 * }
 * ```
 */
export async function uploadCoverImageAction(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  try {
    // 1. Supabase 클라이언트 생성 (매번 새로 생성 - Fluid compute 환경 고려)
    const supabase = await createClient();

    // 2. 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "로그인이 필요합니다. 다시 로그인해 주세요.",
      };
    }

    // 3. FormData에서 파일 추출
    const file = formData.get("file") as File | null;

    if (!file) {
      return {
        success: false,
        message: "업로드할 파일을 선택해주세요.",
        errors: {
          file: ["파일이 선택되지 않았습니다."],
        },
      };
    }

    // 4. 파일 크기 검증 (5MB = 5 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: "파일 크기가 너무 큽니다. 5MB 이하의 파일을 업로드해주세요.",
        errors: {
          file: [
            `파일 크기가 ${(file.size / 1024 / 1024).toFixed(2)}MB입니다. 5MB 이하의 파일만 업로드 가능합니다.`,
          ],
        },
      };
    }

    // 5. 파일 타입 검증 (JPEG, PNG, WebP만 허용)
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        message:
          "지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.",
        errors: {
          file: [`현재 파일 타입: ${file.type}. JPEG, PNG, WebP 형식만 지원됩니다.`],
        },
      };
    }

    // 6. 타임스탬프 기반 고유 파일명 생성
    // 형식: {timestamp}_{원본파일명}
    // 예: 1735123456789_event-cover.jpg
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); // 특수문자 제거
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;

    // 7. Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("event-covers")
      .upload(uniqueFileName, file, {
        cacheControl: "3600", // 1시간 캐시
        upsert: false, // 파일명이 고유하므로 덮어쓰기 비활성화
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return {
        success: false,
        message: "이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.",
        errors: {
          file: [uploadError.message || "업로드 실패"],
        },
      };
    }

    // 8. Public URL 생성 및 반환
    const {
      data: { publicUrl },
    } = supabase.storage.from("event-covers").getPublicUrl(uploadData.path);

    return {
      success: true,
      message: "이미지가 성공적으로 업로드되었습니다.",
      data: {
        url: publicUrl,
      },
    };
  } catch (error) {
    console.error("Unexpected error in uploadCoverImageAction:", error);
    return {
      success: false,
      message: "예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}
