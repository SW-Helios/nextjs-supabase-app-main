/**
 * E2E 테스트용 인증 헬퍼 함수
 *
 * Playwright 테스트에서 사용하는 인증 관련 유틸리티입니다.
 */

import type { Page } from "@playwright/test";

/**
 * 테스트 사용자 계정 정보
 */
export const TEST_USER = {
  email: "ehduslsw000@gmail.com",
  password: "dltjsdn8*",
} as const;

/**
 * 관리자 계정 정보
 */
export const ADMIN_USER = {
  email: "bruce.lean17@gmail.com",
  password: "qwer1234",
} as const;

/**
 * 사용자 계정 타입
 */
export type UserCredentials = {
  email: string;
  password: string;
};

/**
 * 일반 사용자 로그인 페이지에서 로그인 수행
 *
 * @param page - Playwright Page 객체
 * @param user - 로그인할 사용자 정보
 * @param options - 추가 옵션
 */
export async function login(
  page: Page,
  user: UserCredentials = TEST_USER,
  options: { waitForNavigation?: boolean } = { waitForNavigation: true }
): Promise<void> {
  // 로그인 페이지로 이동
  await page.goto("/auth/login");

  // 이메일 입력
  await page.fill("#email", user.email);

  // 비밀번호 입력
  await page.fill("#password", user.password);

  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');

  // 네비게이션 대기 (옵션)
  if (options.waitForNavigation) {
    await page.waitForURL(/^(?!.*\/auth\/login).*$/);
  }
}

/**
 * 관리자 로그인 페이지에서 로그인 수행
 *
 * @param page - Playwright Page 객체
 * @param user - 로그인할 관리자 정보
 */
export async function adminLogin(page: Page, user: UserCredentials = ADMIN_USER): Promise<void> {
  // 관리자 로그인 페이지로 이동
  await page.goto("/admin/login");

  // 이메일 입력
  await page.fill("#email", user.email);

  // 비밀번호 입력
  await page.fill("#password", user.password);

  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');

  // 대시보드로 이동 대기
  await page.waitForURL(/\/admin\/dashboard/);
}

/**
 * 로그아웃 수행
 *
 * @param page - Playwright Page 객체
 */
export async function logout(page: Page): Promise<void> {
  // 프로필 페이지로 이동
  await page.goto("/profile");

  // 로그아웃 버튼 클릭
  const logoutButton = page.getByRole("button", { name: /로그아웃/i });
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    // 로그인 페이지로 리다이렉트 대기
    await page.waitForURL(/\/auth\/login/);
  }
}

/**
 * 현재 사용자가 로그인 상태인지 확인
 *
 * @param page - Playwright Page 객체
 * @returns 로그인 상태 여부
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // 홈 페이지로 이동
  await page.goto("/");

  // URL이 로그인 페이지가 아닌지 확인
  const url = page.url();
  return !url.includes("/auth/login");
}

/**
 * 보호된 페이지 접근 시 리다이렉트 확인
 *
 * @param page - Playwright Page 객체
 * @param protectedPath - 보호된 페이지 경로
 * @returns 로그인 페이지로 리다이렉트되었는지 여부
 */
export async function checkProtectedRedirect(page: Page, protectedPath: string): Promise<boolean> {
  await page.goto(protectedPath);
  const url = page.url();
  return url.includes("/auth/login");
}
