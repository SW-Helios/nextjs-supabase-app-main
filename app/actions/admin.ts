/**
 * 관리자 전용 Server Actions
 *
 * 관리자 대시보드, 이벤트 관리, 사용자 관리, 통계 페이지에서
 * 사용하는 Server Actions를 제공합니다.
 *
 * 모든 액션은 verifyAdminAccess()를 통해 관리자 권한을 확인합니다.
 */

"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminAccess } from "@/lib/utils/admin";
import {
  getDashboardMetrics,
  getEventStats,
  getAdminEvents,
  getAdminUsers,
} from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types/forms";
import type {
  DashboardMetrics,
  EventStats,
  EventQueryParams,
  UserQueryParams,
  PaginationResult,
  EventTableRow,
  UserTableRow,
} from "@/lib/types/admin";

/**
 * 대시보드 지표 조회 Server Action
 *
 * 관리자 대시보드에 표시되는 주요 KPI 지표를 조회합니다.
 *
 * @returns {Promise<ActionResult<DashboardMetrics>>} 대시보드 지표 데이터
 *
 * @example
 * ```typescript
 * const result = await getDashboardMetricsAction();
 * if (result.success && result.data) {
 *   console.log('Total Events:', result.data.total_events);
 * }
 * ```
 */
export async function getDashboardMetricsAction(): Promise<ActionResult<DashboardMetrics>> {
  try {
    // 관리자 권한 확인
    const authCheck = await verifyAdminAccess();
    if (!authCheck.authorized) {
      return {
        success: false,
        message: authCheck.message,
      };
    }

    // 대시보드 지표 조회
    const metrics = await getDashboardMetrics();

    return {
      success: true,
      message: "대시보드 지표를 조회했습니다.",
      data: metrics,
    };
  } catch (error) {
    console.error("[ADMIN] 대시보드 지표 조회 중 예외 발생:", error);
    return {
      success: false,
      message: "대시보드 지표 조회 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 통계 차트 데이터 조회 Server Action
 *
 * 관리자 통계 페이지의 차트 데이터를 조회합니다.
 *
 * @returns {Promise<ActionResult<EventStats>>} 통계 차트 데이터
 *
 * @example
 * ```typescript
 * const result = await getEventStatsAction();
 * if (result.success && result.data) {
 *   console.log('Event Trend:', result.data.event_trend);
 * }
 * ```
 */
export async function getEventStatsAction(): Promise<ActionResult<EventStats>> {
  try {
    // 관리자 권한 확인
    const authCheck = await verifyAdminAccess();
    if (!authCheck.authorized) {
      return {
        success: false,
        message: authCheck.message,
      };
    }

    // 통계 데이터 조회
    const stats = await getEventStats();

    return {
      success: true,
      message: "통계 데이터를 조회했습니다.",
      data: stats,
    };
  } catch (error) {
    console.error("[ADMIN] 통계 데이터 조회 중 예외 발생:", error);
    return {
      success: false,
      message: "통계 데이터 조회 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 관리자 이벤트 관리 테이블 데이터 조회 Server Action
 *
 * 이벤트 목록을 검색, 필터, 정렬, 페이지네이션하여 반환합니다.
 *
 * @param {EventQueryParams} params - 쿼리 파라미터
 * @returns {Promise<ActionResult<PaginationResult<EventTableRow>>>} 페이지네이션 결과
 *
 * @example
 * ```typescript
 * const result = await getAdminEventsAction({
 *   searchQuery: '개발',
 *   statusFilter: 'upcoming',
 *   sortBy: 'event_date',
 *   sortOrder: 'asc',
 *   page: 1,
 *   pageSize: 10
 * });
 * ```
 */
export async function getAdminEventsAction(
  params: EventQueryParams
): Promise<ActionResult<PaginationResult<EventTableRow>>> {
  try {
    // 관리자 권한 확인
    const authCheck = await verifyAdminAccess();
    if (!authCheck.authorized) {
      return {
        success: false,
        message: authCheck.message,
      };
    }

    // 이벤트 목록 조회
    const result = await getAdminEvents(params);

    return {
      success: true,
      message: "이벤트 목록을 조회했습니다.",
      data: result,
    };
  } catch (error) {
    console.error("[ADMIN] 이벤트 목록 조회 중 예외 발생:", error);
    return {
      success: false,
      message: "이벤트 목록 조회 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 관리자 사용자 관리 테이블 데이터 조회 Server Action
 *
 * 사용자 목록을 검색, 필터, 정렬, 페이지네이션하여 반환합니다.
 *
 * @param {UserQueryParams} params - 쿼리 파라미터
 * @returns {Promise<ActionResult<PaginationResult<UserTableRow>>>} 페이지네이션 결과
 *
 * @example
 * ```typescript
 * const result = await getAdminUsersAction({
 *   searchQuery: 'john',
 *   roleFilter: 'admin',
 *   sortBy: 'created_at',
 *   sortOrder: 'desc',
 *   page: 1,
 *   pageSize: 10
 * });
 * ```
 */
export async function getAdminUsersAction(
  params: UserQueryParams
): Promise<ActionResult<PaginationResult<UserTableRow>>> {
  try {
    // 관리자 권한 확인
    const authCheck = await verifyAdminAccess();
    if (!authCheck.authorized) {
      return {
        success: false,
        message: authCheck.message,
      };
    }

    // 사용자 목록 조회
    const result = await getAdminUsers(params);

    return {
      success: true,
      message: "사용자 목록을 조회했습니다.",
      data: result,
    };
  } catch (error) {
    console.error("[ADMIN] 사용자 목록 조회 중 예외 발생:", error);
    return {
      success: false,
      message: "사용자 목록 조회 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 관리자용 이벤트 삭제 Server Action
 *
 * 관리자가 임의의 이벤트를 삭제합니다.
 * CASCADE 설정으로 연관된 참여자 정보도 자동으로 삭제됩니다.
 *
 * @param {string} eventId - 삭제할 이벤트 ID
 * @returns {Promise<ActionResult>} 삭제 결과
 *
 * @example
 * ```typescript
 * const result = await deleteEventByAdminAction('event-uuid');
 * if (result.success) {
 *   console.log('Event deleted successfully');
 * }
 * ```
 */
export async function deleteEventByAdminAction(eventId: string): Promise<ActionResult> {
  try {
    // 관리자 권한 확인
    const authCheck = await verifyAdminAccess();
    if (!authCheck.authorized) {
      return {
        success: false,
        message: authCheck.message,
      };
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 이벤트 존재 여부 확인
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("id, title")
      .eq("id", eventId)
      .single();

    if (fetchError || !existingEvent) {
      console.error("[ADMIN] 이벤트 조회 실패:", fetchError);
      return {
        success: false,
        message: "이벤트를 찾을 수 없습니다.",
      };
    }

    // 이벤트 삭제 (CASCADE로 참여자도 자동 삭제)
    console.log("[ADMIN] 이벤트 삭제 시도:", {
      eventId,
      adminId: authCheck.userId,
      eventTitle: existingEvent.title,
    });

    const { error: deleteError } = await supabase.from("events").delete().eq("id", eventId);

    if (deleteError) {
      console.error("[ADMIN] 이벤트 삭제 실패:", deleteError);
      return {
        success: false,
        message: `이벤트 삭제에 실패했습니다: ${deleteError.message}`,
      };
    }

    // 캐시 무효화
    revalidatePath("/admin/events");
    revalidatePath("/admin/dashboard");

    console.log("[ADMIN] 이벤트 삭제 성공:", { eventId });

    return {
      success: true,
      message: "이벤트가 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    console.error("[ADMIN] 이벤트 삭제 중 예외 발생:", error);
    return {
      success: false,
      message: "이벤트 삭제 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 관리자용 사용자 삭제 Server Action
 *
 * 관리자가 임의의 사용자를 삭제합니다.
 * CASCADE 설정으로 연관된 이벤트 및 참여 정보도 자동으로 삭제됩니다.
 *
 * @param {string} userId - 삭제할 사용자 ID
 * @returns {Promise<ActionResult>} 삭제 결과
 *
 * @example
 * ```typescript
 * const result = await deleteUserByAdminAction('user-uuid');
 * if (result.success) {
 *   console.log('User deleted successfully');
 * }
 * ```
 */
export async function deleteUserByAdminAction(userId: string): Promise<ActionResult> {
  try {
    // 관리자 권한 확인
    const authCheck = await verifyAdminAccess();
    if (!authCheck.authorized) {
      return {
        success: false,
        message: authCheck.message,
      };
    }

    // 자기 자신은 삭제할 수 없음
    if (authCheck.userId === userId) {
      return {
        success: false,
        message: "자기 자신은 삭제할 수 없습니다.",
      };
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 사용자 존재 여부 확인
    const { data: existingUser, error: fetchError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", userId)
      .single();

    if (fetchError || !existingUser) {
      console.error("[ADMIN] 사용자 조회 실패:", fetchError);
      return {
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      };
    }

    // 사용자 삭제 (CASCADE로 연관 데이터도 자동 삭제)
    console.log("[ADMIN] 사용자 삭제 시도:", {
      userId,
      adminId: authCheck.userId,
      userName: existingUser.full_name,
      userEmail: existingUser.email,
    });

    const { error: deleteError } = await supabase.from("profiles").delete().eq("id", userId);

    if (deleteError) {
      console.error("[ADMIN] 사용자 삭제 실패:", deleteError);
      return {
        success: false,
        message: `사용자 삭제에 실패했습니다: ${deleteError.message}`,
      };
    }

    // 캐시 무효화
    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");

    console.log("[ADMIN] 사용자 삭제 성공:", { userId });

    return {
      success: true,
      message: "사용자가 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    console.error("[ADMIN] 사용자 삭제 중 예외 발생:", error);
    return {
      success: false,
      message: "사용자 삭제 중 오류가 발생했습니다.",
    };
  }
}
