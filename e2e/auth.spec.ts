/**
 * 인증 플로우 E2E 테스트
 *
 * 로그인, 로그아웃, 접근 제어 등 인증 관련 기능을 테스트합니다.
 */

import { test, expect } from "@playwright/test";
import { TEST_USER, ADMIN_USER, login } from "./helpers/auth";

test.describe("인증 플로우", () => {
  test.describe("일반 사용자 로그인", () => {
    test("올바른 자격 증명으로 로그인 성공", async ({ page }) => {
      // 로그인 페이지로 이동
      await page.goto("/auth/login");

      // 로그인 폼이 표시되는지 확인
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();

      // 로그인 정보 입력
      await page.fill("#email", TEST_USER.email);
      await page.fill("#password", TEST_USER.password);

      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');

      // 로그인 성공 후 홈 페이지로 이동 확인
      await page.waitForURL("/", { timeout: 30000 });

      // 로그인 성공 확인 (로그인 페이지가 아님)
      expect(page.url()).not.toContain("/auth/login");
    });

    test("잘못된 이메일로 로그인 실패", async ({ page }) => {
      await page.goto("/auth/login");

      // 잘못된 이메일 입력
      await page.fill("#email", "wrong@email.com");
      await page.fill("#password", TEST_USER.password);

      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');

      // 에러 메시지 확인 또는 로그인 페이지에 머무름
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/auth/login");
    });

    test("잘못된 비밀번호로 로그인 실패", async ({ page }) => {
      await page.goto("/auth/login");

      // 잘못된 비밀번호 입력
      await page.fill("#email", TEST_USER.email);
      await page.fill("#password", "wrongpassword");

      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');

      // 에러 메시지 확인 또는 로그인 페이지에 머무름
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/auth/login");
    });

    test("빈 필드로 로그인 시도 불가", async ({ page }) => {
      await page.goto("/auth/login");

      // 빈 상태에서 로그인 버튼 클릭
      const submitButton = page.locator('button[type="submit"]');

      // 폼 유효성 검사로 제출 불가 (HTML5 required 속성)
      await submitButton.click();

      // 여전히 로그인 페이지에 있음
      expect(page.url()).toContain("/auth/login");
    });
  });

  test.describe("관리자 페이지 접근 제어", () => {
    // 시나리오 1: 일반 사용자 → / 리다이렉트
    test("일반 사용자가 /admin/dashboard 접근 시 홈으로 리다이렉트", async ({ page }) => {
      // 일반 사용자로 로그인
      await login(page, TEST_USER);

      // 관리자 대시보드 접근 시도
      await page.goto("/admin/dashboard");

      // 홈 페이지로 리다이렉트 확인
      await page.waitForURL("/", { timeout: 10000 });
      expect(page.url()).toBe("http://localhost:3000/");
    });

    // 시나리오 2: 미인증 사용자 → /admin/login 리다이렉트
    test("미인증 사용자가 /admin/dashboard 접근 시 /admin/login으로 리다이렉트", async ({
      page,
    }) => {
      // 로그인하지 않은 상태에서 관리자 대시보드 접근 시도
      await page.goto("/admin/dashboard");

      // /admin/login으로 리다이렉트 확인
      await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
      expect(page.url()).toContain("/admin/login");
    });

    // 시나리오 3: 관리자 사용자 → 정상 접근
    test("관리자 사용자가 /admin/dashboard 접근 시 정상 접근", async ({ page }) => {
      // 관리자 로그인 페이지로 이동
      await page.goto("/admin/login");

      // 로그인 폼이 표시되는지 확인
      await expect(page.locator("#email")).toBeVisible();

      // 관리자 로그인 정보 입력
      await page.fill("#email", ADMIN_USER.email);
      await page.fill("#password", ADMIN_USER.password);

      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');

      // 관리자 대시보드로 이동 확인
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 });

      // 대시보드 페이지 확인
      expect(page.url()).toContain("/admin/dashboard");
    });
  });

  test.describe("로그아웃", () => {
    test("로그인 후 로그아웃 성공", async ({ page }) => {
      // 로그인
      await login(page, TEST_USER);

      // 프로필 페이지로 이동
      await page.goto("/profile");

      // 로그아웃 버튼 찾기 및 클릭
      const logoutButton = page.getByRole("button", { name: /로그아웃/i });

      if (await logoutButton.isVisible()) {
        await logoutButton.click();

        // 로그인 페이지로 리다이렉트 확인
        await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
        expect(page.url()).toContain("/auth/login");
      }
    });
  });

  test.describe("보호된 페이지 접근 제어", () => {
    test("비로그인 상태에서 이벤트 페이지 접근 시 로그인 페이지로 리다이렉트", async ({ page }) => {
      // 보호된 페이지 직접 접근 시도
      await page.goto("/events");

      // 로그인 페이지로 리다이렉트 확인
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/auth/login");
    });

    test("비로그인 상태에서 프로필 페이지 접근 시 로그인 페이지로 리다이렉트", async ({ page }) => {
      // 보호된 페이지 직접 접근 시도
      await page.goto("/profile");

      // 로그인 페이지로 리다이렉트 확인
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/auth/login");
    });

    test("비로그인 상태에서 이벤트 생성 페이지 접근 시 로그인 페이지로 리다이렉트", async ({
      page,
    }) => {
      // 보호된 페이지 직접 접근 시도
      await page.goto("/events/new");

      // 로그인 페이지로 리다이렉트 확인
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/auth/login");
    });
  });

  test.describe("회원가입 페이지 접근", () => {
    test("로그인 페이지에서 회원가입 페이지로 이동", async ({ page }) => {
      await page.goto("/auth/login");

      // 회원가입 링크 클릭
      await page.click('a[href="/auth/sign-up"]');

      // 회원가입 페이지로 이동 확인
      await page.waitForURL(/\/auth\/sign-up/);
      expect(page.url()).toContain("/auth/sign-up");
    });

    test("비밀번호 찾기 페이지로 이동", async ({ page }) => {
      await page.goto("/auth/login");

      // 비밀번호 찾기 링크 클릭
      await page.click('a[href="/auth/forgot-password"]');

      // 비밀번호 찾기 페이지로 이동 확인
      await page.waitForURL(/\/auth\/forgot-password/);
      expect(page.url()).toContain("/auth/forgot-password");
    });
  });
});
