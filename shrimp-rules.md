# Development Guidelines

> **중요**: 이 문서는 AI Agent가 코드를 작성하고 수정할 때 반드시 따라야 하는 프로젝트별 규칙을 정의합니다.

---

## 1. 프로젝트 개요

### 1.1 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16+ (App Router, Turbopack) |
| 인증/DB | Supabase (Auth, Database, Storage) |
| 스타일링 | Tailwind CSS 4.x |
| UI 라이브러리 | shadcn/ui (new-york 스타일) |
| 폼 처리 | React Hook Form + Zod |
| 테마 | next-themes (다크 모드 지원) |
| 언어 | TypeScript (strict mode) |
| 차트 | Recharts |

### 1.2 핵심 기능

- 이벤트 생성/관리/참여 시스템
- 초대 코드 기반 이벤트 참여
- OAuth 및 이메일 인증
- 관리자 대시보드 (통계, 사용자 관리)
- 모바일 중심 UI

### 1.3 테스트 계정

| 용도 | 이메일 | 비밀번호 |
|------|--------|----------|
| 일반 사용자 | gymcoding@gmail.com | qwer1234 |
| 관리자 | bruce.lean17@gmail.com | qwer1234 |

---

## 2. 프로젝트 아키텍처

### 2.1 디렉토리 구조

```
app/
├── (mobile)/           # 모바일 중심 레이아웃 라우트 그룹
│   ├── events/         # 이벤트 관련 페이지
│   │   ├── new/        # 이벤트 생성
│   │   └── [id]/       # 이벤트 상세/수정
│   ├── profile/        # 프로필 페이지
│   ├── invite/[code]/  # 초대 링크 프리뷰
│   └── join/[code]/    # 초대 링크 참여
├── admin/              # 관리자 영역 (role: 'admin' 필요)
│   ├── (dashboard)/    # 관리자 대시보드 레이아웃
│   │   ├── dashboard/  # 대시보드 메인
│   │   ├── events/     # 이벤트 관리
│   │   ├── users/      # 사용자 관리
│   │   └── stats/      # 통계
│   └── login/          # 관리자 로그인
├── auth/               # 인증 관련 페이지 (공개)
│   ├── login/
│   ├── sign-up/
│   ├── setup-profile/  # OAuth 후 닉네임 설정
│   ├── callback/       # OAuth 콜백 처리
│   └── confirm/        # 이메일 확인
├── actions/            # Server Actions
│   ├── events.ts       # 이벤트 CRUD
│   ├── profile.ts      # 프로필 관리
│   ├── auth.ts         # 인증 관련
│   ├── admin.ts        # 관리자 기능
│   └── upload.ts       # 파일 업로드
└── protected/          # 인증 필요 페이지 (예시)

components/
├── ui/                 # shadcn/ui 컴포넌트
├── events/             # 이벤트 관련 컴포넌트
├── navigation/         # 네비게이션 컴포넌트
│   ├── mobile-nav.tsx  # 모바일 하단 네비게이션
│   └── admin-sidebar.tsx # 관리자 사이드바
├── admin/              # 관리자 컴포넌트
│   └── charts/         # 차트 컴포넌트
├── participants/       # 참여자 관련 컴포넌트
└── skeletons/          # 로딩 스켈레톤

lib/
├── supabase/           # Supabase 클라이언트 설정
│   ├── server.ts       # Server Components용
│   ├── client.ts       # Client Components용
│   ├── middleware.ts   # 미들웨어용
│   └── database.types.ts # DB 타입 (자동 생성)
├── schemas/            # Zod 검증 스키마
├── queries/            # 데이터 조회 함수
├── types/              # TypeScript 타입
│   └── forms.ts        # ActionResult 타입
└── utils/              # 유틸리티 함수
    └── invite-code.ts  # 초대 코드 생성
```

### 2.2 라우트 보호 체계

| 경로 | 접근 권한 | 미들웨어 동작 |
|------|-----------|---------------|
| `/` | 모든 사용자 | 통과 |
| `/auth/*` | 모든 사용자 | 통과 |
| `/(mobile)/*` | 인증된 사용자 | 미인증 시 `/auth/login`으로 리다이렉트 (redirect 파라미터 포함) |
| `/admin/login` | 모든 사용자 | 통과 |
| `/admin/*` | admin role 필요 | 미인증 시 `/admin/login`, 권한 없을 시 `/`로 리다이렉트 |

### 2.3 데이터베이스 스키마

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `profiles` | 사용자 프로필 | id, username, full_name, avatar_url, role, email |
| `events` | 이벤트 | id, title, description, location, event_date, invite_code, created_by, status, cover_image_url |
| `event_participants` | 이벤트 참여자 | id, event_id, user_id, role (host/participant) |

---

## 3. Supabase 사용 규칙 ⚠️

### 3.1 클라이언트 생성 패턴

**반드시 환경에 따라 올바른 Supabase 클라이언트를 사용하라:**

| 환경 | 파일 경로 | 함수 | 사용 위치 |
|------|-----------|------|-----------|
| Server Components | `lib/supabase/server.ts` | `createClient()` | Server Components, Route Handlers, Server Actions |
| Client Components | `lib/supabase/client.ts` | `createClient()` | Client Components (브라우저) |
| Middleware | `lib/supabase/middleware.ts` | `updateSession()` | `middleware.ts` |

### 3.2 Server Components에서 Supabase 클라이언트 사용

**✅ 올바른 예시:**
```typescript
import { createClient } from "@/lib/supabase/server";

export default async function ServerComponent() {
  // 매번 함수 내에서 새로 생성
  const supabase = await createClient();
  const { data } = await supabase.from('events').select();

  return <div>{/* ... */}</div>;
}
```

**❌ 잘못된 예시:**
```typescript
import { createClient } from "@/lib/supabase/server";

// 전역 변수로 생성 금지!
const supabase = await createClient();

export default async function ServerComponent() {
  const { data } = await supabase.from('events').select();
  return <div>{/* ... */}</div>;
}
```

**⚠️ 중요:**
- Server Components, Route Handlers, Server Actions에서는 **반드시 함수 내부에서 매번 새로 생성**하라
- 전역 변수로 저장하지 마라 (Fluid compute 환경에서 문제 발생)

### 3.3 Client Components에서 Supabase 클라이언트 사용

**✅ 올바른 예시:**
```typescript
'use client';

import { createClient } from "@/lib/supabase/client";

export default function ClientComponent() {
  const supabase = createClient();

  const handleClick = async () => {
    const { data } = await supabase.from('events').select();
  };

  return <button onClick={handleClick}>Load Data</button>;
}
```

**규칙:**
- Client Components에서는 `lib/supabase/client.ts`의 `createClient()`를 사용하라
- `'use client'` 지시어를 파일 상단에 추가하라
- Server용 클라이언트를 Client Component에서 사용하지 마라

### 3.4 Middleware 수정 시 주의사항

**⚠️ 절대 금지:**
- `lib/supabase/middleware.ts`의 `createServerClient`와 `supabase.auth.getClaims()` 사이에 코드를 추가하지 마라
- 이를 위반하면 사용자가 무작위로 로그아웃될 수 있음

**✅ 올바른 패턴 (새 Response 생성 시):**
```typescript
const myNewResponse = NextResponse.next({ request });
myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll());
return myNewResponse;
```

---

## 4. Server Actions 패턴

### 4.1 파일 위치 및 구조

- **위치**: `app/actions/` 디렉토리
- **파일**: 기능별 분리 (events.ts, profile.ts, auth.ts, admin.ts, upload.ts)

### 4.2 기본 패턴

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mySchema } from "@/lib/schemas/my-schema";
import type { ActionResult } from "@/lib/types/forms";

/**
 * 기능 설명 (한국어)
 *
 * @param _prevState - 이전 상태 (useActionState에서 사용)
 * @param formData - 폼 데이터
 * @returns Promise<ActionResult<ReturnType>> - 결과
 */
export async function myAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // A. Supabase 클라이언트 생성 (함수 내부에서 매번 새로 생성)
    const supabase = await createClient();

    // B. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    // C. 서버 사이드 스키마 검증 (Zod)
    const validatedFields = mySchema.safeParse({
      field: formData.get("field"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "입력된 정보를 확인해주세요.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // D. 비즈니스 로직 수행

    // E. 캐시 무효화
    revalidatePath("/related-path");

    return {
      success: true,
      message: "성공 메시지",
      data: { id: "result-id" },
    };
  } catch (error) {
    console.error("에러 발생:", error);
    return {
      success: false,
      message: "오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}
```

### 4.3 ActionResult 타입

```typescript
// lib/types/forms.ts 참조
interface ActionResult<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
```

### 4.4 Server Action 사용 예시

```typescript
// Client Component에서 사용
'use client';

import { useActionState } from "react";
import { createEventAction } from "@/app/actions/events";

export function EventForm() {
  const [state, formAction, isPending] = useActionState(createEventAction, {
    success: false,
    message: "",
  });

  return (
    <form action={formAction}>
      <input name="title" />
      <button type="submit" disabled={isPending}>
        {isPending ? "처리 중..." : "생성"}
      </button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

---

## 5. 코드 규칙

### 5.1 언어 규칙

- **주석**: 한국어 작성
- **커밋 메시지**: 한국어 작성
- **UI 텍스트/에러 메시지**: 한국어 작성
- **변수명/함수명**: 영어 (camelCase)
- **컴포넌트명**: 영어 (PascalCase)

### 5.2 경로 별칭

**반드시 `@/*` 경로 별칭을 사용하라:**

**✅ 올바른 예시:**
```typescript
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/types/forms";
```

**❌ 잘못된 예시:**
```typescript
import { createClient } from "../../lib/supabase/server";
import { Button } from "../components/ui/button";
```

### 5.3 파일 명명 규칙

**파일명은 kebab-case를 사용하라:**
- ✅ `event-card.tsx`
- ✅ `mobile-nav.tsx`
- ❌ `EventCard.tsx`
- ❌ `mobileNav.tsx`

**컴포넌트명은 PascalCase를 사용하라:**
```typescript
// 파일: event-card.tsx
export function EventCard() { /* ... */ }
```

### 5.4 TypeScript 규칙

- `strict` 모드 활성화됨
- `noUnusedLocals`, `noUnusedParameters` 활성화됨
- `any` 타입 사용 금지
- 함수의 매개변수와 반환 타입 명시

---

## 6. UI 컴포넌트 규칙

### 6.1 shadcn/ui 컴포넌트

- **스타일**: `new-york`
- **위치**: `components/ui/`
- **아이콘**: Lucide React

### 6.2 컴포넌트 추가 방법

```bash
npx shadcn@latest add [component-name]

# 예시
npx shadcn@latest add button
npx shadcn@latest add dialog card
```

### 6.3 아이콘 사용

**lucide-react 아이콘을 사용하라:**

```typescript
import { ChevronRight, User, Settings, Calendar, MapPin } from "lucide-react";

export function MyComponent() {
  return (
    <div>
      <User className="h-4 w-4" />
      <Calendar className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}
```

### 6.4 스타일링 규칙

**Tailwind CSS와 `cn()` 유틸리티를 사용하라:**

```typescript
import { cn } from "@/lib/utils";

export function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      className={cn(
        "rounded-md px-4 py-2",
        isActive ? "bg-primary text-white" : "bg-secondary"
      )}
    >
      버튼
    </button>
  );
}
```

**❌ 피해야 할 패턴:**
```typescript
// 문자열 연결 사용 금지
<button className={`rounded-md ${isActive ? "bg-primary" : "bg-secondary"}`}>

// 인라인 스타일 사용 금지
<button style={{ padding: '10px' }}>
```

---

## 7. 컴포넌트 작성 규칙

### 7.1 Server Components vs Client Components

**기본적으로 Server Components를 사용하라:**
- 데이터 페칭이 필요한 경우
- SEO가 중요한 경우

**Client Components는 다음 경우에만 사용하라:**
- 브라우저 API 사용 (useState, useEffect 등)
- 이벤트 핸들러 사용 (onClick, onChange 등)
- React Hooks 사용

### 7.2 비동기 Server Components

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function EventList() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from('events')
    .select('*, profiles(username, avatar_url)')
    .order('event_date', { ascending: true });

  return (
    <div>
      {events?.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

---

## 8. 워크플로우

### 8.1 개발 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run check-all` | 모든 검사 통합 실행 (필수) |
| `npm run typecheck` | TypeScript 타입 체크 |
| `npm run lint:fix` | ESLint 자동 수정 |
| `npm run format` | Prettier 포맷팅 |

### 8.2 작업 완료 체크리스트

```bash
# 1. 모든 검사 통과 확인
npm run check-all

# 2. 빌드 성공 확인
npm run build
```

### 8.3 DB 타입 업데이트

```bash
# 로컬 Supabase 사용 시
npm run db:types:local

# 원격 Supabase 사용 시
npm run db:types
```

---

## 9. 금지 사항 ❌

### 9.1 절대 금지 목록

| 항목 | 이유 |
|------|------|
| Supabase 클라이언트 전역 변수 사용 | Fluid compute 환경에서 세션 문제 발생 |
| 미들웨어 내 `createServerClient`와 `getClaims()` 사이에 코드 추가 | 사용자 세션 무작위 로그아웃 발생 |
| Response 객체 생성 후 쿠키 미복사 | 브라우저-서버 세션 불일치 |
| 영어 주석/메시지 작성 | 프로젝트 규칙 위반 |
| 상대 경로 import | 프로젝트 규칙 위반, `@/*` 사용 필수 |
| `any` 타입 남용 | TypeScript strict mode 위반 |
| 인라인 스타일 사용 | Tailwind CSS 사용 필수 |
| shadcn/ui 컴포넌트 수동 생성 | `npx shadcn@latest add` 사용 필수 |

---

## 10. AI 의사결정 기준

### 10.1 새 페이지 추가 시

| 페이지 유형 | 위치 |
|-------------|------|
| 모바일 페이지 | `app/(mobile)/[경로]/page.tsx` |
| 관리자 페이지 | `app/admin/(dashboard)/[경로]/page.tsx` |
| 인증 페이지 | `app/auth/[경로]/page.tsx` |

### 10.2 새 Server Action 추가 시

1. `app/actions/` 디렉토리에 기능별 파일 생성 또는 기존 파일에 추가
2. `ActionResult` 타입 사용
3. Zod 스키마로 입력 검증 (`lib/schemas/`)
4. 인증 확인 로직 포함
5. 에러 메시지는 한국어로 작성
6. JSDoc 주석 추가

### 10.3 새 컴포넌트 추가 시

| 컴포넌트 유형 | 위치 |
|--------------|------|
| UI 기본 컴포넌트 | `npx shadcn@latest add` 사용 |
| 이벤트 관련 | `components/events/` |
| 관리자 관련 | `components/admin/` |
| 네비게이션 | `components/navigation/` |
| 스켈레톤 | `components/skeletons/` |
| 공용 컴포넌트 | `components/` |

### 10.4 데이터베이스 연동 시

1. `lib/supabase/database.types.ts`에서 타입 확인
2. Server Component에서는 `lib/supabase/server.ts` 사용
3. Client Component에서는 `lib/supabase/client.ts` 사용
4. 데이터 변경 후 `revalidatePath()` 호출

---

## 11. 핵심 파일 상호작용

### 11.1 동시 수정 필요 파일

| 변경 사항 | 함께 수정해야 할 파일 |
|-----------|----------------------|
| DB 테이블 추가/수정 | `lib/supabase/database.types.ts` 재생성 필요 (`npm run db:types:local`) |
| 새 보호 경로 추가 | `lib/supabase/middleware.ts` 라우트 규칙 확인 |
| 새 Server Action 추가 | `lib/types/forms.ts` 타입 확인, `lib/schemas/` 스키마 추가 |
| 새 폼 추가 | `lib/schemas/` 검증 스키마 추가 |

### 11.2 파일 참조 관계

```
middleware.ts
└── lib/supabase/middleware.ts (updateSession)

app/actions/*.ts
├── lib/supabase/server.ts (createClient)
├── lib/schemas/*.ts (Zod 스키마)
└── lib/types/forms.ts (ActionResult)

components/**/*.tsx
├── components/ui/* (shadcn/ui)
└── lib/supabase/client.ts (Client Component에서만)
```

---

## 12. 요약

이 프로젝트에서 가장 중요한 규칙:

1. **Supabase 클라이언트를 올바르게 사용하라** (Server/Client 구분, 매번 새로 생성)
2. **Server Actions 패턴을 따르라** (ActionResult 타입, Zod 검증)
3. **`@/*` 경로 별칭을 사용하라**
4. **기본적으로 Server Components를 사용하라**
5. **shadcn/ui를 통해 UI 컴포넌트를 추가하라**
6. **Tailwind CSS와 `cn()` 유틸리티를 사용하라**
7. **커밋 전에 `npm run check-all`을 실행하라**
8. **주석, 메시지, 문서는 한국어로 작성하라**

이 규칙들을 따르면 일관되고 유지보수 가능한 코드를 작성할 수 있다.
