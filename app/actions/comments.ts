/**
 * 댓글 관련 Server Actions
 *
 * Next.js 15 Server Actions 패턴을 사용한 댓글 CRUD 작업입니다.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { commentFormSchema, commentUpdateSchema } from "@/lib/schemas/comment";
import type { ActionResult } from "@/lib/types/forms";

/**
 * 댓글 생성 Server Action
 *
 * @param eventId - 이벤트 ID
 * @param _prevState - 이전 상태 (useFormState용)
 * @param formData - 폼 데이터 (content, image_urls)
 * @returns Promise<ActionResult<{ id: string }>> - 생성 결과
 */
export async function createCommentAction(
  eventId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // 데이터 파싱
    const imageUrlsRaw = formData.get("image_urls");
    const imageUrls = imageUrlsRaw ? JSON.parse(imageUrlsRaw as string) : [];

    // 검증
    const validatedFields = commentFormSchema.safeParse({
      content: formData.get("content"),
      image_urls: imageUrls,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "입력된 정보를 확인해주세요.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // 댓글 생성
    const { data: comment, error: insertError } = await supabase
      .from("event_comments")
      .insert({
        event_id: eventId,
        user_id: user.id,
        content: validatedFields.data.content,
        image_urls: validatedFields.data.image_urls,
      })
      .select()
      .single();

    if (insertError || !comment) {
      console.error("[createCommentAction] 댓글 생성 실패:", insertError);
      return {
        success: false,
        message: `댓글 작성에 실패했습니다: ${insertError?.message || "알 수 없는 오류"}`,
      };
    }

    // 캐시 무효화
    revalidatePath(`/events/${eventId}`);

    return {
      success: true,
      message: "댓글이 작성되었습니다.",
      data: { id: comment.id },
    };
  } catch (error) {
    console.error("[createCommentAction] 예외 발생:", error);
    return {
      success: false,
      message: "댓글 작성 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 댓글 수정 Server Action
 *
 * @param commentId - 댓글 ID
 * @param eventId - 이벤트 ID (캐시 무효화용)
 * @param _prevState - 이전 상태 (useFormState용)
 * @param formData - 폼 데이터 (content)
 * @returns Promise<ActionResult<{ id: string }>> - 수정 결과
 */
export async function updateCommentAction(
  commentId: string,
  eventId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // 검증
    const validatedFields = commentUpdateSchema.safeParse({
      content: formData.get("content"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "입력된 정보를 확인해주세요.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // 소유권 확인 후 수정 (RLS에서도 검증하지만 명시적으로 체크)
    const { data: comment, error: updateError } = await supabase
      .from("event_comments")
      .update({
        content: validatedFields.data.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("user_id", user.id) // 본인 댓글만 수정 가능
      .select()
      .single();

    if (updateError || !comment) {
      console.error("[updateCommentAction] 댓글 수정 실패:", updateError);
      return {
        success: false,
        message: "댓글 수정에 실패했습니다. 권한을 확인해주세요.",
      };
    }

    // 캐시 무효화
    revalidatePath(`/events/${eventId}`);

    return {
      success: true,
      message: "댓글이 수정되었습니다.",
      data: { id: comment.id },
    };
  } catch (error) {
    console.error("[updateCommentAction] 예외 발생:", error);
    return {
      success: false,
      message: "댓글 수정 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 댓글 삭제 Server Action
 *
 * 작성자 본인 또는 관리자만 삭제 가능합니다.
 *
 * @param commentId - 댓글 ID
 * @param eventId - 이벤트 ID (캐시 무효화용)
 * @returns Promise<ActionResult> - 삭제 결과
 */
export async function deleteCommentAction(
  commentId: string,
  eventId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // 관리자 여부 확인
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // 삭제 쿼리 구성 (본인 또는 관리자)
    // RLS 정책에서도 검증하지만, 관리자인 경우 user_id 조건 제외
    let deleteQuery = supabase.from("event_comments").delete().eq("id", commentId);

    if (!isAdmin) {
      deleteQuery = deleteQuery.eq("user_id", user.id);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error("[deleteCommentAction] 댓글 삭제 실패:", deleteError);
      return {
        success: false,
        message: "댓글 삭제에 실패했습니다.",
      };
    }

    // 캐시 무효화
    revalidatePath(`/events/${eventId}`);

    return {
      success: true,
      message: "댓글이 삭제되었습니다.",
    };
  } catch (error) {
    console.error("[deleteCommentAction] 예외 발생:", error);
    return {
      success: false,
      message: "댓글 삭제 중 오류가 발생했습니다.",
    };
  }
}
