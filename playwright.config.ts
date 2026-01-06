import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

// .env.local 파일 로드
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

/**
 * Playwright 테스트 설정
 *
 * Next.js 앱의 E2E 테스트를 위한 설정입니다.
 * 인증 상태 관리를 위해 storageState를 사용합니다.
 *
 * @see https://playwright.dev/docs/test-configuration
 */

// 인증 상태 저장 경로
const STORAGE_STATE_USER = path.join(__dirname, ".auth/user.json");
const STORAGE_STATE_ADMIN = path.join(__dirname, ".auth/admin.json");

export default defineConfig({
  // 테스트 파일 위치
  testDir: "./e2e",

  // 병렬 실행 설정
  fullyParallel: true,

  // CI에서 실패 시 재시도 안 함
  forbidOnly: !!process.env.CI,

  // 로컬에서 실패 시 1번 재시도
  retries: process.env.CI ? 2 : 1,

  // 병렬 워커 수
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: "html",

  // 공통 테스트 설정
  use: {
    // 기본 URL (로컬 개발 서버)
    baseURL: "http://localhost:3000",

    // 스크린샷 설정 (실패 시만)
    screenshot: "only-on-failure",

    // 비디오 설정 (실패 시만)
    video: "retain-on-failure",

    // 트레이스 설정 (실패 시만)
    trace: "on-first-retry",

    // 타임아웃 설정
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 프로젝트별 설정
  projects: [
    // 일반 사용자 인증 설정
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // 관리자 인증 설정
    {
      name: "admin-setup",
      testMatch: /admin\.setup\.ts/,
    },
    // 인증 테스트 (인증 불필요)
    {
      name: "auth-tests",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // 인증된 사용자 테스트
    {
      name: "authenticated",
      testMatch: /.*(?<!admin)\.spec\.ts/,
      testIgnore: /auth\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: STORAGE_STATE_USER,
      },
    },
    // 관리자 테스트
    {
      name: "admin",
      testMatch: /admin.*\.spec\.ts/,
      dependencies: ["admin-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: STORAGE_STATE_ADMIN,
      },
    },
  ],

  // 로컬 개발 서버 설정
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2분
  },
});

// storageState 경로 export (테스트 파일에서 사용)
export { STORAGE_STATE_USER, STORAGE_STATE_ADMIN };
