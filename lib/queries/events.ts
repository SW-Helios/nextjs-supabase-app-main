/**
 * 이벤트 관련 데이터베이스 쿼리 함수
 *
 * Server Components에서 사용하는 Supabase 쿼리 모음입니다.
 */

import { createClient } from "@/lib/supabase/server";
import type { EventWithHost } from "@/lib/types/models";

/**
 * 단일 이벤트 조회 (호스트 정보 및 참여자 수 포함)
 *
 * @param eventId - 조회할 이벤트 ID
 * @returns Promise<EventWithHost | null> - 이벤트 정보 또는 null
 */
export async function getEventWithHost(eventId: string): Promise<EventWithHost | null> {
  try {
    const supabase = await createClient();

    // 이벤트 기본 정보 + 호스트 정보 조회
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        *,
        host:profiles!events_created_by_fkey(id, username, avatar_url)
      `
      )
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      // 이벤트가 없거나 조회 실패 시 조용히 null 반환
      return null;
    }

    // 참여자 수 조회 (호스트 제외)
    const { count, error: countError } = await supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .neq("role", "host");

    if (countError) {
      // 참여자 수 조회 실패 시 0으로 처리
    }

    // EventWithHost 타입으로 변환
    return {
      ...event,
      host: Array.isArray(event.host) ? event.host[0] : event.host,
      participant_count: count ?? 0,
    } as EventWithHost;
  } catch {
    // getEventWithHost 예외 발생 시 null 반환
    return null;
  }
}

/**
 * 사용자가 생성한 이벤트 목록 조회
 *
 * @param userId - 사용자 ID
 * @returns Promise<EventWithHost[]> - 이벤트 목록
 */
export async function getUserHostedEvents(userId: string): Promise<EventWithHost[]> {
  try {
    const supabase = await createClient();

    // 사용자가 created_by인 이벤트 조회
    const { data: events, error } = await supabase
      .from("events")
      .select(
        `
        *,
        host:profiles!events_created_by_fkey(id, username, avatar_url)
      `
      )
      .eq("created_by", userId)
      .order("event_date", { ascending: false });

    if (error) {
      // 호스팅 이벤트 조회 실패 시 빈 배열 반환
      return [];
    }

    if (!events || events.length === 0) {
      return [];
    }

    // 각 이벤트의 참여자 수 조회 (호스트 제외)
    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const { count, error: countError } = await supabase
          .from("event_participants")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)
          .neq("role", "host");

        if (countError) {
          // 참여자 수 조회 실패 시 0으로 처리
        }

        return {
          ...event,
          host: Array.isArray(event.host) ? event.host[0] : event.host,
          participant_count: count ?? 0,
        } as EventWithHost;
      })
    );

    return eventsWithCount;
  } catch {
    // getUserHostedEvents 예외 발생 시 빈 배열 반환
    return [];
  }
}

/**
 * 사용자가 참여한 이벤트 목록 조회 (호스팅 제외)
 *
 * @param userId - 사용자 ID
 * @returns Promise<EventWithHost[]> - 이벤트 목록
 */
export async function getUserParticipatingEvents(userId: string): Promise<EventWithHost[]> {
  try {
    const supabase = await createClient();

    // event_participants 테이블에서 user_id가 일치하고 role이 'participant'인 레코드 조회
    const { data: participants, error: participantsError } = await supabase
      .from("event_participants")
      .select("event_id")
      .eq("user_id", userId)
      .eq("role", "participant");

    if (participantsError) {
      // 참여 이벤트 조회 실패 시 빈 배열 반환
      return [];
    }

    if (!participants || participants.length === 0) {
      return [];
    }

    // 이벤트 ID 목록 추출
    const eventIds = participants.map((p) => p.event_id);

    // 이벤트 정보 조회 (호스트 정보 포함)
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(
        `
        *,
        host:profiles!events_created_by_fkey(id, username, avatar_url)
      `
      )
      .in("id", eventIds)
      .order("event_date", { ascending: false });

    if (eventsError) {
      // 참여 이벤트 정보 조회 실패 시 빈 배열 반환
      return [];
    }

    if (!events || events.length === 0) {
      return [];
    }

    // 각 이벤트의 참여자 수 조회 (호스트 제외)
    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const { count, error: countError } = await supabase
          .from("event_participants")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)
          .neq("role", "host");

        if (countError) {
          // 참여자 수 조회 실패 시 0으로 처리
        }

        return {
          ...event,
          host: Array.isArray(event.host) ? event.host[0] : event.host,
          participant_count: count ?? 0,
        } as EventWithHost;
      })
    );

    return eventsWithCount;
  } catch {
    // getUserParticipatingEvents 예외 발생 시 빈 배열 반환
    return [];
  }
}

/**
 * 이벤트 상세 정보 조회 (참여자 목록 포함)
 *
 * @param eventId - 조회할 이벤트 ID
 * @returns Promise<EventDetail | null> - 이벤트 상세 정보 또는 null
 */
export async function getEventDetail(eventId: string) {
  try {
    const supabase = await createClient();

    // 이벤트 기본 정보 + 호스트 정보 조회
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        *,
        host:profiles!events_created_by_fkey(id, username, avatar_url)
      `
      )
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      // 이벤트가 없거나 조회 실패 시 조용히 null 반환 (삭제된 이벤트의 경우)
      return null;
    }

    // 참여자 목록 조회 (사용자 정보 및 고정 참여자 포함, 호스트 제외)
    const { data: participants, error: participantsError } = await supabase
      .from("event_participants")
      .select(
        `
        id,
        role,
        joined_at,
        user_id,
        participant_name,
        user:profiles!event_participants_user_id_fkey(id, username, avatar_url)
      `
      )
      .eq("event_id", eventId)
      .neq("role", "host") // 호스트는 참여자 목록에서 제외
      .order("joined_at", { ascending: true });

    if (participantsError) {
      // 참여자 조회 실패 시 빈 배열로 처리
    }

    // 타입 변환 (실제 사용자와 고정 참여자 모두 처리)
    const participantsList = (participants || []).map((p) => ({
      id: p.id,
      role: p.role,
      joined_at: p.joined_at,
      user_id: p.user_id,
      participant_name: p.participant_name,
      user: p.user_id && p.user ? (Array.isArray(p.user) ? p.user[0] : p.user) : null,
    }));

    return {
      ...event,
      host: Array.isArray(event.host) ? event.host[0] : event.host,
      participant_count: participantsList.length,
      participants: participantsList,
    };
  } catch {
    // getEventDetail 예외 발생 시 null 반환
    return null;
  }
}

/**
 * 사용자가 특정 이벤트의 호스트인지 확인
 *
 * @param userId - 사용자 ID
 * @param eventId - 이벤트 ID
 * @returns Promise<boolean> - 호스트 여부
 */
export async function isUserHost(userId: string, eventId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("event_participants")
      .select("role")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .eq("role", "host")
      .single();

    if (error) {
      return false;
    }

    return !!data;
  } catch {
    // isUserHost 예외 발생 시 false 반환
    return false;
  }
}

/**
 * 모든 진행중인 이벤트 조회 (호스트 정보 및 참여자 수 포함)
 *
 * @param limit - 최대 조회 개수 (기본값: 20)
 * @returns Promise<EventWithHost[]> - 이벤트 목록
 */
export async function getActiveEvents(limit: number = 20): Promise<EventWithHost[]> {
  try {
    const supabase = await createClient();

    // 모든 active 상태의 이벤트 조회 (최신순)
    const { data: events, error } = await supabase
      .from("events")
      .select(
        `
        *,
        host:profiles!events_created_by_fkey(id, username, avatar_url)
      `
      )
      .eq("status", "active")
      .order("event_date", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[getActiveEvents] 진행중인 이벤트 조회 실패:", error);
      return [];
    }

    if (!events || events.length === 0) {
      return [];
    }

    // 각 이벤트의 참여자 수 조회 (호스트 제외)
    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const { count, error: countError } = await supabase
          .from("event_participants")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)
          .neq("role", "host");

        if (countError) {
          // 참여자 수 조회 실패 시 0으로 처리
        }

        return {
          ...event,
          host: Array.isArray(event.host) ? event.host[0] : event.host,
          participant_count: count ?? 0,
        } as EventWithHost;
      })
    );

    return eventsWithCount;
  } catch {
    console.error("[getActiveEvents] 예외 발생");
    return [];
  }
}

/**
 * 초대 코드로 이벤트 조회 (호스트 정보 및 참여자 수 포함)
 *
 * @param inviteCode - 이벤트 초대 코드
 * @param userId - 현재 사용자 ID (선택 사항, 참여 여부 확인용)
 * @returns Promise<EventWithHost & { isParticipating: boolean } | null> - 이벤트 정보 또는 null
 */
export async function getEventByInviteCode(
  inviteCode: string,
  userId?: string
): Promise<(EventWithHost & { isParticipating: boolean }) | null> {
  try {
    const supabase = await createClient();

    // 이벤트 기본 정보 + 호스트 정보 조회
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        *,
        host:profiles!events_created_by_fkey(id, username, avatar_url)
      `
      )
      .eq("invite_code", inviteCode)
      .single();

    if (eventError || !event) {
      // 이벤트가 없거나 조회 실패 시 조용히 null 반환
      return null;
    }

    // 참여자 수 조회 (호스트 제외)
    const { count, error: countError } = await supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .neq("role", "host");

    if (countError) {
      // 참여자 수 조회 실패 시 0으로 처리
    }

    // 참여 여부 확인 (userId가 제공된 경우에만)
    let isParticipating = false;
    if (userId) {
      const { data: participant, error: participantError } = await supabase
        .from("event_participants")
        .select("id")
        .eq("user_id", userId)
        .eq("event_id", event.id)
        .single();

      if (participantError && participantError.code !== "PGRST116") {
        // PGRST116: 결과 없음 (정상)
      }

      isParticipating = !!participant;
    }

    // EventWithHost 타입으로 변환하고 isParticipating 추가
    return {
      ...event,
      host: Array.isArray(event.host) ? event.host[0] : event.host,
      participant_count: count ?? 0,
      isParticipating,
    } as EventWithHost & { isParticipating: boolean };
  } catch {
    // getEventByInviteCode 예외 발생 시 null 반환
    return null;
  }
}
