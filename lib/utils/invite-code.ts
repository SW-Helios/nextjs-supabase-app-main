/**
 * 초대 코드 생성 유틸리티
 *
 * 이벤트 초대를 위한 고유한 코드를 생성하는 함수를 제공합니다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 고유한 초대 코드 생성
 *
 * 6자리 대문자 영숫자로 구성된 랜덤 초대 코드를 생성하고,
 * Supabase 데이터베이스에서 중복 여부를 확인합니다.
 * 중복이 없을 때까지 최대 10회 재시도합니다.
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @returns Promise<string> - 고유한 6자리 초대 코드
 * @throws Error - 10회 시도 후에도 고유한 코드를 생성하지 못한 경우
 *
 * @example
 * ```typescript
 * const supabase = await createClient();
 * const inviteCode = await generateUniqueInviteCode(supabase);
 * console.log(inviteCode); // "A3B5C7" (예시)
 * ```
 */
export async function generateUniqueInviteCode(
  supabase: SupabaseClient<Database>
): Promise<string> {
  // 대문자 영숫자 문자 집합 (I, O, 0, 1 제외하여 혼동 방지)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codeLength = 6;
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // 랜덤 코드 생성
    let code = "";
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }

    // 중복 체크
    const { data, error } = await supabase
      .from("events")
      .select("id")
      .eq("invite_code", code)
      .single();

    // 에러가 발생했지만 "PGRST116" (no rows) 에러인 경우는 중복이 없다는 의미
    if (error) {
      if (error.code === "PGRST116") {
        // 중복이 없음 - 코드 반환
        return code;
      }
      // 다른 에러인 경우 로그 출력하고 재시도
      console.error(`초대 코드 중복 체크 실패 (시도 ${attempt}/${maxAttempts}):`, error);
      continue;
    }

    // data가 있으면 중복이므로 재시도
    if (!data) {
      // 중복이 없음 - 코드 반환
      return code;
    }
  }

  // 최대 시도 횟수 초과
  throw new Error(
    `${maxAttempts}회 시도 후에도 고유한 초대 코드를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.`
  );
}

/**
 * 초대 코드 유효성 검증
 *
 * 초대 코드가 올바른 형식인지 검증합니다.
 *
 * @param code - 검증할 초대 코드
 * @returns boolean - 유효한 형식이면 true, 아니면 false
 *
 * @example
 * ```typescript
 * validateInviteCode("A3B5C7"); // true
 * validateInviteCode("abc123"); // false (소문자 포함)
 * validateInviteCode("A3B5"); // false (6자리 미만)
 * ```
 */
export function validateInviteCode(code: string): boolean {
  // 6자리 대문자 영숫자 (I, O, 0, 1 제외)
  const inviteCodePattern = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
  return inviteCodePattern.test(code);
}
