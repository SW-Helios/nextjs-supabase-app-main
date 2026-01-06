/**
 * 관리자 페이지 더미 데이터
 *
 * 관리자 대시보드, 통계, 테이블에서 사용하는 더미 데이터를 제공합니다.
 */

import type {
  DashboardMetrics,
  ChartDataPoint,
  EventTableRow,
  UserTableRow,
} from "@/lib/types/admin";
import { dummyEvents } from "./events";
import { dummyUsers } from "./users";

/**
 * 대시보드 KPI 지표 더미 데이터
 *
 * 관리자 대시보드 상단에 표시되는 주요 통계 지표입니다.
 */
export const dashboardMetrics: DashboardMetrics = {
  total_events: 20, // 전체 이벤트 수 (dummyEvents 개수)
  total_users: 10, // 전체 사용자 수 (dummyUsers 개수)
  today_events: 2, // 오늘 생성된 이벤트 수
  week_events: 5, // 이번 주 생성된 이벤트 수
  month_events: 10, // 이번 달 생성된 이벤트 수
  today_users: 1, // 오늘 가입한 사용자 수
  week_users: 3, // 이번 주 가입한 사용자 수
  avg_participants: 8, // 이벤트당 평균 참여자 수
};

/**
 * 이벤트 생성 추이 차트 데이터 (최근 30일)
 *
 * 일별 이벤트 생성 수를 나타내는 시계열 데이터입니다.
 */
export const eventTrendData: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));

  // 랜덤하게 0~3개의 이벤트 생성 (실제처럼 보이도록)
  const randomValue = Math.floor(Math.random() * 4);

  return {
    date: date.toISOString().split("T")[0],
    value: randomValue,
  };
});

/**
 * 사용자 가입 추이 차트 데이터 (최근 30일)
 *
 * 일별 신규 사용자 가입 수를 나타내는 시계열 데이터입니다.
 */
export const userTrendData: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));

  // 랜덤하게 0~2명의 사용자 가입 (실제처럼 보이도록)
  const randomValue = Math.floor(Math.random() * 3);

  return {
    date: date.toISOString().split("T")[0],
    value: randomValue,
  };
});

/**
 * 이벤트 상태별 분포 차트 데이터
 *
 * 이벤트의 현재 상태(진행중/종료/취소)별 개수입니다.
 */
export const eventStatusData = [
  {
    name: "진행 중",
    value: 15, // active events
  },
  {
    name: "종료",
    value: 5, // completed events
  },
  {
    name: "취소됨",
    value: 0, // cancelled events
  },
];

/**
 * 인기 이벤트 TOP 5 차트 데이터
 *
 * 참여자 수가 많은 상위 5개 이벤트입니다.
 */
export const topEventsData = [
  {
    name: "AI/ML 해커톤 2025",
    participants: 24,
  },
  {
    name: "개발자 네트워킹 밤",
    participants: 18,
  },
  {
    name: "풀스택 부트캠프",
    participants: 15,
  },
  {
    name: "백엔드 컨퍼런스",
    participants: 12,
  },
  {
    name: "UX/UI 워크샵",
    participants: 10,
  },
];

/**
 * 이벤트 관리 테이블 데이터 생성
 *
 * 기존 dummyEvents에 호스트 이름과 참여자 수를 추가한 확장 데이터를 반환합니다.
 *
 * @returns 이벤트 테이블 행 배열
 */
export function getEventTableRows(): EventTableRow[] {
  return dummyEvents.map((event) => {
    // 이벤트 생성자(호스트) 찾기
    const host = dummyUsers.find((user) => user.id === event.created_by);

    // 랜덤 참여자 수 (5~25명 사이)
    const participantCount = Math.floor(Math.random() * 21) + 5;

    return {
      ...event,
      host_name: host?.full_name || "알 수 없음",
      participant_count: participantCount,
    };
  });
}

/**
 * 사용자 관리 테이블 데이터 생성
 *
 * 기존 dummyUsers에 이벤트 생성/참여 통계를 추가한 확장 데이터를 반환합니다.
 *
 * @returns 사용자 테이블 행 배열
 */
export function getUserTableRows(): UserTableRow[] {
  return dummyUsers.map((user, index) => {
    // 호스트 사용자(user-001 ~ user-005)는 이벤트를 생성했음
    const isHost = index < 5;

    // 호스트는 각각 4개의 이벤트를 생성 (총 20개 / 5명 = 4개)
    const createdEventsCount = isHost ? 4 : 0;

    // 참여 이벤트 수는 랜덤 (0~8개)
    const participatedEventsCount = Math.floor(Math.random() * 9);

    return {
      ...user,
      created_events_count: createdEventsCount,
      participated_events_count: participatedEventsCount,
    };
  });
}
