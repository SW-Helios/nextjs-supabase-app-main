/**
 * 댓글 관련 데이터베이스 쿼리 함수
 *
 * Server Components에서 사용하는 Supabase 쿼리 모음입니다.
 */

import { createClient } from "@/lib/supabase/server";
import type { CommentWithUser } from "@/lib/types/models";

/**
 * 이벤트의 댓글 목록 조회 (작성자 정보 포함)
 *
 * @param eventId - 이벤트 ID
 * @param limit - 조회 개수 (기본값: 50)
 * @param offset - 오프셋 (페이지네이션용)
 * @returns Promise<CommentWithUser[]> - 댓글 목록
 */
export async function getEventComments(
  eventId: string,
  limit: number = 50,
  offset: number = 0
): Promise<CommentWithUser[]> {
  try {
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("event_comments")
      .select(
        `
        *,
        user:profiles!event_comments_user_id_fkey(id, username, avatar_url)
      `
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[getEventComments] 댓글 조회 실패:", error);
      return [];
    }

    // 타입 변환 (user가 배열로 올 수 있으므로 첫 번째 요소 추출)
    return (comments || []).map((comment) => ({
      ...comment,
      user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
    })) as CommentWithUser[];
  } catch {
    console.error("[getEventComments] 예외 발생");
    return [];
  }
}

/**
 * 이벤트의 댓글 수 조회
 *
 * @param eventId - 이벤트 ID
 * @returns Promise<number> - 댓글 수
 */
export async function getEventCommentCount(eventId: string): Promise<number> {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("event_comments")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (error) {
      console.error("[getEventCommentCount] 댓글 수 조회 실패:", error);
      return 0;
    }

    return count ?? 0;
  } catch {
    console.error("[getEventCommentCount] 예외 발생");
    return 0;
  }
}
