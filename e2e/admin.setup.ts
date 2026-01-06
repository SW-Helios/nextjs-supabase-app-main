/**
 * 관리자 인증 설정 (Setup)
 *
 * 테스트 실행 전에 관리자로 로그인하고
 * 인증 상태를 저장합니다.
 */

import { test as setup, expect } from "@playwright/test";
import { ADMIN_USER } from "./helpers/auth";
import path from "path";

// 인증 상태 저장 경로
const authFile = path.join(__dirname, "../.auth/admin.json");

setup("관리자 인증", async ({ page }) => {
  // 관리자 로그인 페이지로 이동
  await page.goto("/admin/login");

  // 로그인 폼이 로드될 때까지 대기
  await expect(page.locator("#email")).toBeVisible();

  // 이메일 입력
  await page.fill("#email", ADMIN_USER.email);

  // 비밀번호 입력
  await page.fill("#password", ADMIN_USER.password);

  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');

  // 로그인 성공 확인 (관리자 대시보드로 이동)
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 });

  // 인증 상태 저장
  await page.context().storageState({ path: authFile });
});
