/**
 * 관리자 전용 데이터베이스 쿼리 함수
 *
 * 관리자 대시보드, 이벤트 관리, 사용자 관리, 통계 페이지에서 사용하는
 * 데이터 조회 쿼리 함수를 제공합니다.
 *
 * 주요 특징:
 * - Promise.all을 활용한 병렬 쿼리 실행
 * - IN 절을 활용한 N+1 쿼리 최적화
 * - 페이지네이션 백엔드 처리
 */

import { createClient } from "@/lib/supabase/server";
import { getTodayRange, getDateRangeFromDays, getRecentDates } from "@/lib/utils/date";
import type {
  DashboardMetrics,
  EventStats,
  ChartDataPoint,
  EventTableRow,
  UserTableRow,
  EventQueryParams,
  UserQueryParams,
  PaginationResult,
} from "@/lib/types/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 대시보드 지표 집계 함수
 *
 * 관리자 대시보드에 표시되는 주요 KPI 지표를 실시간으로 집계합니다.
 * Promise.all을 사용하여 8개 쿼리를 병렬로 실행하여 성능을 최적화합니다.
 *
 * @returns {Promise<DashboardMetrics>} 대시보드 지표 객체
 *
 * @example
 * ```typescript
 * const metrics = await getDashboardMetrics();
 * console.log({
 *   total_events: metrics.total_events,
 *   total_users: metrics.total_users,
 *   avg_participants: metrics.avg_participants
 * });
 * ```
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const supabase = await createClient();

    // 날짜 범위 계산
    const { start: todayStart } = getTodayRange();
    const weekStart = getDateRangeFromDays(7);
    const monthStart = getDateRangeFromDays(30);

    // 8개 쿼리를 병렬로 실행 (Promise.all)
    const [
      totalEvents,
      todayEvents,
      weekEvents,
      monthEvents,
      totalUsers,
      todayUsers,
      weekUsers,
      avgParticipants,
    ] = await Promise.all([
      // 전체 이벤트 수
      supabase.from("events").select("*", { count: "exact", head: true }),
      // 오늘 생성된 이벤트 수
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart),
      // 이번 주 생성된 이벤트 수
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart),
      // 이번 달 생성된 이벤트 수
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart),
      // 전체 사용자 수
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      // 오늘 가입한 사용자 수
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart),
      // 이번 주 가입한 사용자 수
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart),
      // 평균 참여자 수 계산
      calculateAverageParticipants(supabase),
    ]);

    return {
      total_events: totalEvents.count ?? 0,
      today_events: todayEvents.count ?? 0,
      week_events: weekEvents.count ?? 0,
      month_events: monthEvents.count ?? 0,
      total_users: totalUsers.count ?? 0,
      today_users: todayUsers.count ?? 0,
      week_users: weekUsers.count ?? 0,
      avg_participants: avgParticipants,
    };
  } catch (error) {
    console.error("[ADMIN] 대시보드 지표 조회 실패:", error);
    // 에러 발생 시 기본값 반환
    return {
      total_events: 0,
      today_events: 0,
      week_events: 0,
      month_events: 0,
      total_users: 0,
      today_users: 0,
      week_users: 0,
      avg_participants: 0,
    };
  }
}

/**
 * 이벤트당 평균 참여자 수 계산
 *
 * 전체 이벤트 수와 전체 참여자 수를 조회하여 평균을 계산합니다.
 *
 * @param {SupabaseClient} supabase - Supabase 클라이언트 인스턴스
 * @returns {Promise<number>} 평균 참여자 수 (소수점 반올림)
 */
async function calculateAverageParticipants(supabase: SupabaseClient): Promise<number> {
  try {
    // 전체 이벤트 수와 전체 참여자 수를 병렬 조회
    const [eventsResult, participantsResult] = await Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("event_participants").select("*", { count: "exact", head: true }),
    ]);

    const totalEvents = eventsResult.count ?? 0;
    const totalParticipants = participantsResult.count ?? 0;

    // 이벤트가 없으면 0 반환
    if (totalEvents === 0) return 0;

    // 평균 계산 (소수점 반올림)
    return Math.round(totalParticipants / totalEvents);
  } catch (error) {
    console.error("[ADMIN] 평균 참여자 수 계산 실패:", error);
    return 0;
  }
}

/**
 * 통계 차트 데이터 집계 함수
 *
 * 최근 30일간의 이벤트 생성 추이와 사용자 가입 추이를 집계합니다.
 * 각 날짜별로 생성된 이벤트 수와 가입한 사용자 수를 카운트합니다.
 *
 * @returns {Promise<EventStats>} 이벤트 추이 및 사용자 추이 데이터
 *
 * @example
 * ```typescript
 * const stats = await getEventStats();
 * console.log({
 *   event_trend: stats.event_trend, // 30개 데이터 포인트
 *   user_trend: stats.user_trend     // 30개 데이터 포인트
 * });
 * ```
 */
export async function getEventStats(): Promise<EventStats> {
  try {
    const supabase = await createClient();

    // 최근 30일 날짜 배열 생성 ('YYYY-MM-DD' 형식)
    const dates = getRecentDates(30);
    const startDate = dates[0]; // 가장 오래된 날짜

    // 이벤트 생성 데이터와 사용자 가입 데이터를 병렬 조회
    const [eventData, userData] = await Promise.all([
      supabase.from("events").select("created_at").gte("created_at", startDate),
      supabase.from("profiles").select("created_at").gte("created_at", startDate),
    ]);

    // 날짜별 이벤트 생성 수 그룹화
    const eventTrend: ChartDataPoint[] = dates.map((date) => {
      const count = eventData.data?.filter((e) => e.created_at.startsWith(date)).length ?? 0;
      return { date, value: count };
    });

    // 날짜별 사용자 가입 수 그룹화
    const userTrend: ChartDataPoint[] = dates.map((date) => {
      const count = userData.data?.filter((u) => u.created_at.startsWith(date)).length ?? 0;
      return { date, value: count };
    });

    return {
      event_trend: eventTrend,
      user_trend: userTrend,
    };
  } catch (error) {
    console.error("[ADMIN] 통계 데이터 조회 실패:", error);
    // 에러 발생 시 빈 배열 반환
    const emptyDates = getRecentDates(30);
    return {
      event_trend: emptyDates.map((date) => ({ date, value: 0 })),
      user_trend: emptyDates.map((date) => ({ date, value: 0 })),
    };
  }
}

/**
 * 관리자 이벤트 관리 테이블 데이터 조회
 *
 * 이벤트 목록을 검색, 필터, 정렬, 페이지네이션하여 반환합니다.
 * N+1 쿼리 문제를 IN 절로 최적화하여 총 2개의 쿼리만 실행합니다.
 *
 * @param {EventQueryParams} params - 쿼리 파라미터
 * @returns {Promise<PaginationResult<EventTableRow>>} 페이지네이션 결과
 *
 * @example
 * ```typescript
 * const result = await getAdminEvents({
 *   searchQuery: '개발',
 *   statusFilter: 'upcoming',
 *   sortBy: 'event_date',
 *   sortOrder: 'asc',
 *   page: 1,
 *   pageSize: 10
 * });
 * ```
 */
export async function getAdminEvents(
  params: EventQueryParams
): Promise<PaginationResult<EventTableRow>> {
  try {
    const supabase = await createClient();
    const {
      searchQuery,
      statusFilter,
      sortBy = "created_at",
      sortOrder = "desc",
      page = 1,
      pageSize = 10,
    } = params;

    // 기본 쿼리 (호스트 정보 JOIN)
    let query = supabase.from("events").select(
      `
        *,
        host:profiles!events_created_by_fkey(id, username, avatar_url)
      `,
      { count: "exact" }
    );

    // 검색 필터 (제목 또는 초대 코드)
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,invite_code.ilike.%${searchQuery}%`);
    }

    // 상태 필터
    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 페이지네이션
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // 쿼리 실행
    const { data: events, error, count } = await query;

    if (error) {
      console.error("[ADMIN] 이벤트 조회 실패:", error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    if (!events || events.length === 0) {
      return {
        data: [],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    }

    // N+1 쿼리 최적화: IN 절로 모든 이벤트의 참여자 수를 한 번에 조회
    const eventIds = events.map((e) => e.id);
    const { data: participantCounts } = await supabase
      .from("event_participants")
      .select("event_id")
      .in("event_id", eventIds);

    // Map으로 이벤트별 참여자 수 그룹화
    const countMap: Record<string, number> = {};
    participantCounts?.forEach((p) => {
      countMap[p.event_id] = (countMap[p.event_id] || 0) + 1;
    });

    // 최종 데이터 매핑
    const eventsWithCount: EventTableRow[] = events.map((event) => ({
      ...event,
      host_name: event.host?.username || "알 수 없음",
      participant_count: countMap[event.id] ?? 0,
    }));

    return {
      data: eventsWithCount,
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  } catch (error) {
    console.error("[ADMIN] 이벤트 조회 중 예외 발생:", error);
    return {
      data: [],
      total: 0,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      totalPages: 0,
    };
  }
}

/**
 * 관리자 사용자 관리 테이블 데이터 조회
 *
 * 사용자 목록을 검색, 필터, 정렬, 페이지네이션하여 반환합니다.
 * N+1 쿼리 문제를 IN 절로 최적화하여 총 3개의 쿼리만 실행합니다.
 * (사용자 조회 1개 + 생성 이벤트와 참여 이벤트 병렬 조회 2개)
 *
 * @param {UserQueryParams} params - 쿼리 파라미터
 * @returns {Promise<PaginationResult<UserTableRow>>} 페이지네이션 결과
 *
 * @example
 * ```typescript
 * const result = await getAdminUsers({
 *   searchQuery: 'john',
 *   roleFilter: 'admin',
 *   sortBy: 'created_at',
 *   sortOrder: 'desc',
 *   page: 1,
 *   pageSize: 10
 * });
 * ```
 */
export async function getAdminUsers(
  params: UserQueryParams
): Promise<PaginationResult<UserTableRow>> {
  try {
    const supabase = await createClient();
    const {
      searchQuery,
      roleFilter,
      sortBy = "created_at",
      sortOrder = "desc",
      page = 1,
      pageSize = 10,
    } = params;

    // 기본 쿼리
    let query = supabase.from("profiles").select("*", { count: "exact" });

    // 검색 필터 (닉네임 또는 이메일)
    if (searchQuery) {
      query = query.or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    // 역할 필터
    if (roleFilter && roleFilter !== "all") {
      query = query.eq("role", roleFilter);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 페이지네이션
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // 쿼리 실행
    const { data: users, error, count } = await query;

    if (error) {
      console.error("[ADMIN] 사용자 조회 실패:", error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    if (!users || users.length === 0) {
      return {
        data: [],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    }

    // N+1 쿼리 최적화: IN 절로 모든 사용자의 이벤트 통계를 병렬 조회
    const userIds = users.map((u) => u.id);
    const [createdEvents, participatedEvents] = await Promise.all([
      // 생성한 이벤트 수
      supabase.from("events").select("created_by").in("created_by", userIds),
      // 참여한 이벤트 수
      supabase.from("event_participants").select("user_id").in("user_id", userIds),
    ]);

    // Map으로 사용자별 생성 이벤트 수 그룹화
    const createdCountMap: Record<string, number> = {};
    createdEvents.data?.forEach((e) => {
      createdCountMap[e.created_by] = (createdCountMap[e.created_by] || 0) + 1;
    });

    // Map으로 사용자별 참여 이벤트 수 그룹화
    const participatedCountMap: Record<string, number> = {};
    participatedEvents.data?.forEach((p) => {
      participatedCountMap[p.user_id] = (participatedCountMap[p.user_id] || 0) + 1;
    });

    // 최종 데이터 매핑
    const usersWithStats: UserTableRow[] = users.map((user) => ({
      ...user,
      created_events_count: createdCountMap[user.id] ?? 0,
      participated_events_count: participatedCountMap[user.id] ?? 0,
    }));

    return {
      data: usersWithStats,
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  } catch (error) {
    console.error("[ADMIN] 사용자 조회 중 예외 발생:", error);
    return {
      data: [],
      total: 0,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      totalPages: 0,
    };
  }
}
