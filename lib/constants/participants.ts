/**
 * 고정 참여자 상수
 *
 * 이벤트에 참여할 수 있는 고정된 6명의 참여자 목록입니다.
 */

/**
 * 참여자 타입
 */
export interface Participant {
  id: string;
  name: string;
}

/**
 * 고정된 참여자 목록 (6명)
 *
 * 이벤트 생성 시 이 목록에서 참여자를 선택할 수 있습니다.
 */
export const FIXED_PARTICIPANTS: Participant[] = [
  { id: "participant-1", name: "쏘니" },
  { id: "participant-2", name: "찰스" },
  { id: "participant-3", name: "엘리자베스" },
  { id: "participant-4", name: "에린" },
  { id: "participant-5", name: "썬" },
  { id: "participant-6", name: "지" },
] as const;

/**
 * 참여자 ID로 참여자 정보 찾기
 */
export function getParticipantById(id: string): Participant | undefined {
  return FIXED_PARTICIPANTS.find((p) => p.id === id);
}

/**
 * 여러 참여자 ID로 참여자 정보 목록 가져오기
 */
export function getParticipantsByIds(ids: string[]): Participant[] {
  return ids.map((id) => getParticipantById(id)).filter((p): p is Participant => p !== undefined);
}
