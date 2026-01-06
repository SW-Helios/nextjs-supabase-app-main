/**
 * 댓글 폼 Zod 스키마
 *
 * 댓글 생성 및 수정 폼에서 사용하는 검증 스키마입니다.
 */

import { z } from "zod";

/**
 * 댓글 생성 스키마
 *
 * 필수 필드:
 * - content: 1-1000자 댓글 내용
 *
 * 선택 필드:
 * - image_urls: 이미지 URL 배열 (최대 3개)
 */
export const commentFormSchema = z.object({
  content: z
    .string()
    .min(1, { message: "댓글 내용을 입력해주세요." })
    .max(1000, { message: "댓글은 최대 1000자까지 입력 가능합니다." }),

  image_urls: z
    .array(z.string().url({ message: "올바른 이미지 URL 형식이 아닙니다." }))
    .max(3, { message: "이미지는 최대 3개까지 첨부 가능합니다." })
    .optional()
    .default([]),
});

/**
 * 댓글 수정 스키마
 *
 * 수정 시에는 content만 변경 가능합니다.
 * 이미지는 수정 시 변경할 수 없습니다.
 */
export const commentUpdateSchema = z.object({
  content: z
    .string()
    .min(1, { message: "댓글 내용을 입력해주세요." })
    .max(1000, { message: "댓글은 최대 1000자까지 입력 가능합니다." }),
});

/**
 * 댓글 생성 폼 데이터 타입
 */
export type CommentFormData = z.infer<typeof commentFormSchema>;

/**
 * 댓글 수정 폼 데이터 타입
 */
export type CommentUpdateData = z.infer<typeof commentUpdateSchema>;
