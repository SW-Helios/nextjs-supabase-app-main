/**
 * 이벤트 폼 Zod 스키마
 *
 * 이벤트 생성 및 수정 폼에서 사용하는 검증 스키마입니다.
 */

import { z } from "zod";

/**
 * 이벤트 폼 검증 스키마
 *
 * 필수 필드:
 * - title: 2-100자 제목
 * - location: 1-200자 장소
 * - event_date: 미래 날짜만 허용
 * - participant_ids: 참여자 ID 목록 (최소 1명)
 *
 * 선택 필드:
 * - description: 최대 500자 설명
 * - cover_image_url: URL 형식 검증
 */
export const eventFormSchema = z.object({
  title: z
    .string()
    .min(2, { message: "제목은 최소 2자 이상이어야 합니다." })
    .max(100, { message: "제목은 최대 100자까지 입력 가능합니다." }),

  description: z
    .string()
    .max(500, { message: "설명은 최대 500자까지 입력 가능합니다." })
    .optional()
    .or(z.literal("")),

  location: z
    .string()
    .min(1, { message: "장소를 입력해주세요." })
    .max(200, { message: "장소는 최대 200자까지 입력 가능합니다." }),

  // 네이버 지도 좌표 (선택 필드)
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),

  event_date: z
    .string()
    .min(1, { message: "이벤트 날짜를 선택해주세요." })
    .refine(
      (dateString) => {
        const eventDate = new Date(dateString);
        const now = new Date();
        return eventDate > now;
      },
      { message: "이벤트 날짜는 현재 시간 이후여야 합니다." }
    ),

  cover_image_url: z
    .string()
    .url({ message: "올바른 URL 형식을 입력해주세요." })
    .optional()
    .or(z.literal("")),

  participant_ids: z
    .array(z.string())
    .min(1, { message: "최소 1명 이상의 참여자를 선택해주세요." })
    .max(6, { message: "최대 6명까지 선택 가능합니다." }),
});

/**
 * 이벤트 폼 데이터 타입
 *
 * eventFormSchema에서 추론된 TypeScript 타입입니다.
 */
export type EventFormData = z.infer<typeof eventFormSchema>;
