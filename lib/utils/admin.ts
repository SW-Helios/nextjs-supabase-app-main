/**
 * 관리자 권한 확인 유틸리티
 *
 * 관리자 기능에 필요한 권한 체크 및 인증 검증 함수를 제공합니다.
 */

import { createClient } from "@/lib/supabase/server";

/**
 * 관리자 권한 확인 결과 타입
 *
 * @property authorized - 권한 보유 여부
 * @property message - 에러 메시지 (authorized=false인 경우)
 * @property userId - 사용자 ID (authorized=true인 경우)
 */
interface AdminAccessResult {
  authorized: boolean;
  message: string;
  userId?: string;
}

/**
 * 관리자 권한 확인 함수
 *
 * profiles 테이블의 role 컬럼을 확인하여 'admin' 여부를 검증합니다.
 * 모든 관리자 Server Actions에서 호출하는 핵심 함수입니다.
 *
 * @returns {Promise<AdminAccessResult>} 권한 확인 결과
 *
 * @example
 * ```typescript
 * // Server Action에서 사용
 * export async function adminAction() {
 *   const authCheck = await verifyAdminAccess();
 *   if (!authCheck.authorized) {
 *     return { success: false, message: authCheck.message };
 *   }
 *   // 관리자 작업 진행...
 * }
 * ```
 */
export async function verifyAdminAccess(): Promise<AdminAccessResult> {
  // Supabase 클라이언트 생성 (매번 새로 생성 - shrimp-rules.md 준수)
  const supabase = await createClient();

  // 1. 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[ADMIN] 인증 실패:", authError);
    return {
      authorized: false,
      message: "로그인이 필요합니다.",
    };
  }

  // 2. 관리자 권한 확인 (profiles.role = 'admin')
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[ADMIN] 프로필 조회 실패:", profileError);
    return {
      authorized: false,
      message: "사용자 정보를 확인할 수 없습니다.",
    };
  }

  if (!profile || profile.role !== "admin") {
    console.warn("[ADMIN] 권한 없는 접근 시도:", { userId: user.id, role: profile?.role });
    return {
      authorized: false,
      message: "관리자 권한이 필요합니다.",
    };
  }

  // 3. 권한 확인 성공
  return {
    authorized: true,
    message: "",
    userId: user.id,
  };
}

/**
 * 관리자 권한 부여/해제 결과 타입
 */
interface AdminRoleResult {
  success: boolean;
  message: string;
}

/**
 * 특정 사용자에게 관리자 권한 부여
 *
 * 현재 사용자가 관리자인 경우에만 실행 가능합니다.
 *
 * @param targetEmail - 권한을 부여할 사용자 이메일
 * @returns 권한 부여 결과
 *
 * @example
 * ```typescript
 * const result = await grantAdminRole('admin@example.com');
 * if (result.success) {
 *   console.log('관리자 권한 부여 성공');
 * }
 * ```
 */
export async function grantAdminRole(targetEmail: string): Promise<AdminRoleResult> {
  // 현재 사용자가 관리자인지 확인
  const authCheck = await verifyAdminAccess();
  if (!authCheck.authorized) {
    return {
      success: false,
      message: authCheck.message,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: "admin", updated_at: new Date().toISOString() })
    .eq("email", targetEmail)
    .select("id")
    .single();

  if (error || !data) {
    console.error("[ADMIN] 권한 부여 실패:", error);
    return {
      success: false,
      message: "권한 부여에 실패했습니다. 사용자를 찾을 수 없습니다.",
    };
  }

  console.log("[ADMIN] 관리자 권한 부여:", { targetEmail, by: authCheck.userId });

  return {
    success: true,
    message: "관리자 권한이 부여되었습니다.",
  };
}

/**
 * 특정 사용자의 관리자 권한 해제
 *
 * 현재 사용자가 관리자인 경우에만 실행 가능합니다.
 * 자기 자신의 권한은 해제할 수 없습니다.
 *
 * @param targetEmail - 권한을 해제할 사용자 이메일
 * @returns 권한 해제 결과
 *
 * @example
 * ```typescript
 * const result = await revokeAdminRole('user@example.com');
 * if (result.success) {
 *   console.log('관리자 권한 해제 성공');
 * }
 * ```
 */
export async function revokeAdminRole(targetEmail: string): Promise<AdminRoleResult> {
  // 현재 사용자가 관리자인지 확인
  const authCheck = await verifyAdminAccess();
  if (!authCheck.authorized) {
    return {
      success: false,
      message: authCheck.message,
    };
  }

  const supabase = await createClient();

  // 대상 사용자 확인
  const { data: targetProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", targetEmail)
    .single();

  if (fetchError || !targetProfile) {
    return {
      success: false,
      message: "대상 사용자를 찾을 수 없습니다.",
    };
  }

  // 자기 자신의 권한 해제 방지
  if (targetProfile.id === authCheck.userId) {
    return {
      success: false,
      message: "자신의 관리자 권한은 해제할 수 없습니다.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "user", updated_at: new Date().toISOString() })
    .eq("email", targetEmail);

  if (error) {
    console.error("[ADMIN] 권한 해제 실패:", error);
    return {
      success: false,
      message: `권한 해제에 실패했습니다: ${error.message}`,
    };
  }

  console.log("[ADMIN] 관리자 권한 해제:", { targetEmail, by: authCheck.userId });

  return {
    success: true,
    message: "관리자 권한이 해제되었습니다.",
  };
}
