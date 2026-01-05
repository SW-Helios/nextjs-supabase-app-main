/**
 * 더미 데이터 통합 및 헬퍼 함수
 *
 * 더미 데이터를 조회하고 조합하는 유틸리티 함수를 제공합니다.
 */

import type {
  User,
  Event,
  EventWithHost,
  ParticipantWithUser,
  EventDetail,
} from "@/lib/types/models";
import { dummyUsers } from "./users";
import { dummyEvents } from "./events";
import { dummyParticipants } from "./participants";

// 데이터 Export
export { dummyUsers, dummyEvents, dummyParticipants };

// 관리자 데이터 Export
export * from "./admin";

/**
 * ID로 사용자 조회
 *
 * @param id - 사용자 ID
 * @returns 사용자 객체 또는 undefined
 */
export function getUserById(id: string): User | undefined {
  return dummyUsers.find((user) => user.id === id);
}

/**
 * ID로 이벤트 조회
 *
 * @param id - 이벤트 ID
 * @returns 이벤트 객체 또는 undefined
 */
export function getEventById(id: string): Event | undefined {
  return dummyEvents.find((event) => event.id === id);
}

/**
 * 상태별 이벤트 목록 조회
 *
 * @param status - 이벤트 상태 ('upcoming' | 'ongoing' | 'ended')
 * @returns 해당 상태의 이벤트 배열
 */
export function getEventsByStatus(status: "upcoming" | "ongoing" | "ended"): Event[] {
  return dummyEvents.filter((event) => event.status === status);
}

/**
 * 이벤트의 참여자 목록 조회 (사용자 정보 포함)
 *
 * @param eventId - 이벤트 ID
 * @returns 참여자 배열 (사용자 정보 포함)
 */
export function getEventParticipants(eventId: string): ParticipantWithUser[] {
  const participants = dummyParticipants.filter((p) => p.event_id === eventId);

  return participants
    .map((participant) => {
      const user = getUserById(participant.user_id);
      if (!user) return null;

      return {
        ...participant,
        user: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
        },
      };
    })
    .filter((p): p is ParticipantWithUser => p !== null);
}

/**
 * 사용자가 참여한 이벤트 목록 조회
 *
 * @param userId - 사용자 ID
 * @returns 참여한 이벤트 배열
 */
export function getUserEvents(userId: string): Event[] {
  const userParticipations = dummyParticipants.filter((p) => p.user_id === userId);

  const eventIds = userParticipations.map((p) => p.event_id);

  return dummyEvents.filter((event) => eventIds.includes(event.id));
}

/**
 * 예정된 이벤트 목록 조회 (최신순)
 *
 * @param limit - 반환할 최대 개수 (기본값: 전체)
 * @returns 예정된 이벤트 배열 (최신순)
 */
export function getUpcomingEvents(limit?: number): Event[] {
  const upcoming = getEventsByStatus("upcoming");

  // 이벤트 날짜 기준으로 정렬 (가까운 순)
  const sorted = upcoming.sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * 호스트 정보를 포함한 이벤트 조회
 *
 * @param eventId - 이벤트 ID
 * @returns 호스트 정보가 포함된 이벤트 또는 undefined
 */
export function getEventWithHost(eventId: string): EventWithHost | undefined {
  const event = getEventById(eventId);
  if (!event) return undefined;

  const host = getUserById(event.created_by);
  if (!host) return undefined;

  const participants = getEventParticipants(eventId);

  return {
    ...event,
    host: {
      id: host.id,
      username: host.username,
      avatar_url: host.avatar_url,
    },
    participant_count: participants.length,
  };
}

/**
 * 호스트 정보를 포함한 모든 이벤트 조회
 *
 * @returns 호스트 정보가 포함된 이벤트 배열
 */
export function getAllEventsWithHost(): EventWithHost[] {
  return dummyEvents
    .map((event) => getEventWithHost(event.id))
    .filter((event): event is EventWithHost => event !== undefined);
}

/**
 * 이벤트 상세 정보 조회 (호스트 + 전체 참여자 포함)
 *
 * @param eventId - 이벤트 ID
 * @returns 상세 이벤트 정보 또는 undefined
 */
export function getEventDetail(eventId: string): EventDetail | undefined {
  const eventWithHost = getEventWithHost(eventId);
  if (!eventWithHost) return undefined;

  const participants = getEventParticipants(eventId);

  return {
    ...eventWithHost,
    participants,
  };
}

/**
 * 사용자가 호스팅하는 이벤트 목록 조회
 *
 * @param userId - 사용자 ID
 * @returns 호스팅하는 이벤트 배열
 */
export function getUserHostedEvents(userId: string): Event[] {
  return dummyEvents.filter((event) => event.created_by === userId);
}

/**
 * 최근 종료된 이벤트 목록 조회
 *
 * @param limit - 반환할 최대 개수 (기본값: 5)
 * @returns 최근 종료된 이벤트 배열
 */
export function getRecentEndedEvents(limit: number = 5): Event[] {
  const ended = getEventsByStatus("ended");

  // 이벤트 날짜 기준으로 정렬 (최근 종료순)
  const sorted = ended.sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  return sorted.slice(0, limit);
}

/**
 * 진행 중인 이벤트 목록 조회
 *
 * @returns 진행 중인 이벤트 배열
 */
export function getOngoingEvents(): Event[] {
  return getEventsByStatus("ongoing");
}

/**
 * 이벤트 참여자 수 조회
 *
 * @param eventId - 이벤트 ID
 * @returns 참여자 수
 */
export function getEventParticipantCount(eventId: string): number {
  return dummyParticipants.filter((p) => p.event_id === eventId).length;
}

/**
 * 사용자가 특정 이벤트에 참여 중인지 확인
 *
 * @param userId - 사용자 ID
 * @param eventId - 이벤트 ID
 * @returns 참여 여부
 */
export function isUserParticipating(userId: string, eventId: string): boolean {
  return dummyParticipants.some((p) => p.user_id === userId && p.event_id === eventId);
}

/**
 * 사용자가 특정 이벤트의 호스트인지 확인
 *
 * @param userId - 사용자 ID
 * @param eventId - 이벤트 ID
 * @returns 호스트 여부
 */
export function isUserHost(userId: string, eventId: string): boolean {
  return dummyParticipants.some(
    (p) => p.user_id === userId && p.event_id === eventId && p.role === "host"
  );
}

/**
 * 초대 코드로 이벤트 조회 (호스트 정보 포함)
 *
 * @param code - 초대 코드 (대소문자 구분 없음)
 * @returns 호스트 정보가 포함된 이벤트 또는 undefined
 */
export function getEventByInviteCode(code: string): EventWithHost | undefined {
  // 대소문자 구분 없이 검색
  const event = dummyEvents.find((e) => e.invite_code.toUpperCase() === code.toUpperCase());

  if (!event) return undefined;

  return getEventWithHost(event.id);
}
