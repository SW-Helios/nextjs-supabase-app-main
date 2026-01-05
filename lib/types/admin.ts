/**
 * 관리자 대시보드 타입 정의
 *
 * 관리자 페이지에서 사용하는 통계, 차트, 테이블 타입을 정의합니다.
 */

import type { Event, User } from "./models";

/**
 * 대시보드 지표 타입
 *
 * 관리자 대시보드 상단에 표시되는 주요 지표입니다.
 *
 * @property today_events - 오늘 생성된 이벤트 수
 * @property week_events - 이번 주 생성된 이벤트 수
 * @property month_events - 이번 달 생성된 이벤트 수
 * @property total_events - 전체 이벤트 수
 * @property today_users - 오늘 가입한 사용자 수
 * @property week_users - 이번 주 가입한 사용자 수
 * @property total_users - 전체 사용자 수
 * @property avg_participants - 이벤트당 평균 참여자 수
 */
export interface DashboardMetrics {
  today_events: number;
  week_events: number;
  month_events: number;
  total_events: number;
  today_users: number;
  week_users: number;
  total_users: number;
  avg_participants: number;
}

/**
 * 차트 데이터 포인트
 *
 * 시계열 차트에서 사용하는 개별 데이터 포인트입니다.
 *
 * @property date - 날짜 (ISO 8601 형식 또는 'YYYY-MM-DD' 형식)
 * @property value - 해당 날짜의 값 (예: 이벤트 수, 사용자 수)
 */
export interface ChartDataPoint {
  date: string;
  value: number;
}

/**
 * 통계 데이터 타입
 *
 * 대시보드에 표시되는 차트 데이터 모음입니다.
 *
 * @property event_trend - 이벤트 생성 추이 (일별 데이터)
 * @property user_trend - 사용자 가입 추이 (일별 데이터)
 */
export interface EventStats {
  event_trend: ChartDataPoint[];
  user_trend: ChartDataPoint[];
}

/**
 * 이벤트 관리 테이블 행 타입
 *
 * 관리자 이벤트 관리 페이지의 테이블에서 사용하는 확장 타입입니다.
 * 기본 Event 정보에 호스트 이름과 참여자 수를 추가합니다.
 *
 * @property host_name - 이벤트 생성자(호스트) 이름
 * @property participant_count - 참여자 수
 */
export interface EventTableRow extends Event {
  host_name: string;
  participant_count: number;
}

/**
 * 사용자 관리 테이블 행 타입
 *
 * 관리자 사용자 관리 페이지의 테이블에서 사용하는 확장 타입입니다.
 * 기본 User 정보에 이벤트 생성/참여 통계를 추가합니다.
 *
 * @property created_events_count - 생성한 이벤트 수
 * @property participated_events_count - 참여한 이벤트 수
 */
export interface UserTableRow extends User {
  created_events_count: number;
  participated_events_count: number;
}

/**
 * 페이지네이션 결과 타입
 *
 * 관리자 테이블의 표준 응답 형식입니다.
 * 페이지네이션 정보와 함께 데이터를 반환합니다.
 *
 * @template T - 데이터 항목 타입 (EventTableRow, UserTableRow 등)
 * @property data - 현재 페이지의 데이터 배열
 * @property total - 전체 항목 수
 * @property page - 현재 페이지 번호 (1부터 시작)
 * @property pageSize - 페이지당 항목 수
 * @property totalPages - 전체 페이지 수
 *
 * @example
 * ```typescript
 * const result: PaginationResult<EventTableRow> = {
 *   data: [...events],
 *   total: 100,
 *   page: 1,
 *   pageSize: 10,
 *   totalPages: 10
 * };
 * ```
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 정렬 순서 타입
 */
export type SortOrder = "asc" | "desc";

/**
 * 이벤트 정렬 가능 필드
 */
export type EventSortField = "created_at" | "event_date" | "title" | "status";

/**
 * 사용자 정렬 가능 필드
 */
export type UserSortField = "created_at" | "full_name" | "email" | "role";

/**
 * 기본 쿼리 파라미터 (공통)
 *
 * 모든 관리자 테이블 쿼리에서 공통으로 사용하는 파라미터입니다.
 *
 * @property searchQuery - 검색 키워드 (선택적)
 * @property sortOrder - 정렬 순서 (기본값: 'desc')
 * @property page - 페이지 번호 (기본값: 1)
 * @property pageSize - 페이지당 항목 수 (기본값: 10)
 */
export interface BaseQueryParams {
  searchQuery?: string;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
}

/**
 * 이벤트 쿼리 파라미터
 *
 * 관리자 이벤트 관리 테이블에서 사용하는 쿼리 파라미터입니다.
 *
 * @property statusFilter - 상태 필터 ('all' | 'upcoming' | 'ongoing' | 'ended')
 * @property sortBy - 정렬 기준 필드
 *
 * @example
 * ```typescript
 * const params: EventQueryParams = {
 *   searchQuery: '개발',
 *   statusFilter: 'upcoming',
 *   sortBy: 'event_date',
 *   sortOrder: 'asc',
 *   page: 1,
 *   pageSize: 10
 * };
 * ```
 */
export interface EventQueryParams extends BaseQueryParams {
  statusFilter?: "all" | "upcoming" | "ongoing" | "ended";
  sortBy?: EventSortField;
}

/**
 * 사용자 쿼리 파라미터
 *
 * 관리자 사용자 관리 테이블에서 사용하는 쿼리 파라미터입니다.
 *
 * @property roleFilter - 역할 필터 ('all' | 'user' | 'admin')
 * @property sortBy - 정렬 기준 필드
 *
 * @example
 * ```typescript
 * const params: UserQueryParams = {
 *   searchQuery: 'john',
 *   roleFilter: 'admin',
 *   sortBy: 'created_at',
 *   sortOrder: 'desc',
 *   page: 1,
 *   pageSize: 10
 * };
 * ```
 */
export interface UserQueryParams extends BaseQueryParams {
  roleFilter?: "all" | "user" | "admin";
  sortBy?: UserSortField;
}
