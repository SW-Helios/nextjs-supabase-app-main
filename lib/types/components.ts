/**
 * 컴포넌트 Props 타입 정의
 *
 * UI 컴포넌트에서 사용하는 Props 타입을 정의합니다.
 */

import type { EventWithHost, ParticipantWithUser } from "./models";

/**
 * 이벤트 카드 컴포넌트 Props
 *
 * 이벤트 목록 또는 카드 형태로 표시할 때 사용합니다.
 *
 * @property event - 표시할 이벤트 정보 (호스트 포함)
 * @property onClick - 카드 클릭 시 실행할 콜백 함수 (선택적)
 * @property showStatus - 이벤트 상태 표시 여부 (선택적, 기본값: true)
 * @property variant - 카드 표시 형태 (선택적, 기본값: 'default')
 */
export interface EventCardProps {
  event: EventWithHost;
  onClick?: () => void;
  showStatus?: boolean;
  variant?: "default" | "compact";
}

/**
 * 참여자 카드 컴포넌트 Props
 *
 * 참여자 목록을 카드 형태로 표시할 때 사용합니다.
 *
 * @property participant - 표시할 참여자 정보 (사용자 정보 포함)
 * @property showRole - 역할 표시 여부 (선택적, 기본값: true)
 * @property size - 카드 크기 (선택적, 기본값: 'md')
 */
export interface ParticipantCardProps {
  participant: ParticipantWithUser;
  showRole?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * 빈 상태 UI 컴포넌트 Props
 *
 * 데이터가 없거나 검색 결과가 없을 때 표시하는 컴포넌트입니다.
 *
 * @property icon - 표시할 아이콘 컴포넌트 (선택적)
 * @property title - 메인 메시지
 * @property description - 부가 설명 (선택적)
 * @property action - 실행 가능한 액션 (선택적)
 * @property action.label - 액션 버튼 라벨
 * @property action.onClick - 액션 버튼 클릭 핸들러
 */
export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * 네비게이션 아이템
 *
 * 메뉴 또는 네비게이션 바에서 사용하는 항목 정보입니다.
 *
 * @property label - 표시할 텍스트
 * @property href - 이동할 경로
 * @property icon - 표시할 아이콘 컴포넌트
 * @property badge - 표시할 배지 숫자 (선택적, 알림 개수 등)
 */
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

/**
 * 이벤트 폼 데이터
 *
 * 이벤트 생성/수정 폼에서 수집하는 데이터입니다.
 *
 * @property title - 이벤트 제목
 * @property description - 이벤트 설명
 * @property location - 이벤트 장소
 * @property event_date - 이벤트 일시 (ISO 8601 형식)
 * @property cover_image - 커버 이미지 파일 (선택적)
 */
export interface EventFormData {
  title: string;
  description: string;
  location: string;
  event_date: string;
  cover_image?: File | null;
}

/**
 * 이벤트 폼 컴포넌트 Props
 *
 * 이벤트 생성/수정 폼 컴포넌트에서 사용합니다.
 *
 * @property initialData - 초기값 (수정 모드 시 사용, 선택적)
 * @property onSubmit - 폼 제출 시 실행할 콜백 함수 (비동기)
 * @property isSubmitting - 제출 중 상태 (선택적, 버튼 비활성화 등)
 */
export interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  isSubmitting?: boolean;
}
