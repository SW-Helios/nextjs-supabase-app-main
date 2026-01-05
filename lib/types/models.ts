/**
 * 도메인 모델 타입 정의
 *
 * Supabase 공식 권장사항에 따라 profiles 테이블을 사용합니다.
 * 참고: https://supabase.com/docs/guides/auth/managing-user-data
 */

import { Database } from "@/lib/supabase/database.types";

/**
 * 사용자 데이터 모델 (profiles 테이블 기반)
 *
 * Supabase의 auth.users를 확장하는 public.profiles 테이블입니다.
 *
 * @property id - 사용자 고유 식별자 (auth.users 참조)
 * @property email - 사용자 이메일 주소
 * @property full_name - 사용자 전체 이름
 * @property username - 사용자명 (선택 사항)
 * @property avatar_url - 프로필 이미지 URL
 * @property website - 웹사이트 URL (선택 사항)
 * @property role - 사용자 권한 ('user' | 'admin')
 * @property created_at - 계정 생성 일시
 * @property updated_at - 정보 수정 일시
 */
export type User = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * 이벤트 데이터 모델
 *
 * 사용자가 생성하는 모임/행사 정보를 나타냅니다.
 *
 * @property id - 이벤트 고유 식별자
 * @property title - 이벤트 제목
 * @property description - 이벤트 설명
 * @property location - 이벤트 장소
 * @property event_date - 이벤트 일시
 * @property cover_image_url - 커버 이미지 URL
 * @property invite_code - 초대 코드 (고유)
 * @property status - 이벤트 상태 ('upcoming' | 'ongoing' | 'ended')
 * @property created_by - 이벤트 생성자 ID (profiles.id 참조)
 * @property created_at - 이벤트 생성 일시
 * @property updated_at - 이벤트 수정 일시
 */
export type Event = Database["public"]["Tables"]["events"]["Row"];

/**
 * 이벤트 참여자 관계 모델
 *
 * 사용자와 이벤트 간의 참여 관계를 나타냅니다.
 *
 * @property id - 참여 관계 고유 식별자
 * @property event_id - 이벤트 ID (events.id 참조)
 * @property user_id - 사용자 ID (profiles.id 참조)
 * @property role - 참여자 역할 ('host' | 'participant')
 * @property joined_at - 참여 일시
 */
export type EventParticipant = Database["public"]["Tables"]["event_participants"]["Row"];

/**
 * 호스트 정보를 포함한 이벤트 모델
 *
 * 이벤트 목록 표시 시 사용하는 확장 타입입니다.
 *
 * @property host - 이벤트 생성자 정보 (id, username, avatar_url만 포함)
 * @property participant_count - 참여자 수
 */
export interface EventWithHost extends Event {
  host: Pick<User, "id" | "username" | "avatar_url">;
  participant_count: number;
}

/**
 * 사용자 정보를 포함한 참여자 모델
 *
 * 참여자 목록 표시 시 사용하는 확장 타입입니다.
 *
 * @property user - 참여자 사용자 정보 (id, username, avatar_url만 포함)
 */
export interface ParticipantWithUser extends EventParticipant {
  user: Pick<User, "id" | "username" | "avatar_url">;
}

/**
 * 이벤트 상세 정보 모델
 *
 * 이벤트 상세 페이지에서 사용하는 완전한 타입입니다.
 * 호스트 정보와 전체 참여자 목록을 포함합니다.
 *
 * @property participants - 참여자 목록 (사용자 정보 포함)
 */
export interface EventDetail extends EventWithHost {
  participants: ParticipantWithUser[];
}
