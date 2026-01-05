# 프로젝트 개발 규칙

> **중요**: 이 문서는 AI Agent가 코드를 작성하고 수정할 때 반드시 따라야 하는 프로젝트별 규칙을 정의합니다.

## 1. Supabase 클라이언트 사용 규칙 ⚠️

### 1.1 클라이언트 생성 패턴

**반드시 환경에 따라 올바른 Supabase 클라이언트를 사용하라:**

| 환경 | 파일 경로 | 함수 | 사용 위치 |
|------|-----------|------|-----------|
| Server Components | `lib/supabase/server.ts` | `createClient()` | Server Components, Route Handlers |
| Client Components | `lib/supabase/client.ts` | `createClient()` | Client Components (브라우저) |
| Middleware | `lib/supabase/middleware.ts` | `updateSession()` | `middleware.ts` |

### 1.2 Server Components에서 Supabase 클라이언트 사용

**✅ 올바른 예시:**
```typescript
import { createClient } from "@/lib/supabase/server";

export default async function ServerComponent() {
  // 매번 함수 내에서 새로 생성
  const supabase = await createClient();
  const { data } = await supabase.from('users').select();

  return <div>{/* ... */}</div>;
}
```

**❌ 잘못된 예시:**
```typescript
import { createClient } from "@/lib/supabase/server";

// 전역 변수로 생성 금지!
const supabase = await createClient();

export default async function ServerComponent() {
  const { data } = await supabase.from('users').select();
  return <div>{/* ... */}</div>;
}
```

**⚠️ 중요:**
- Server Components와 Route Handlers에서는 **반드시 함수 내부에서 매번 새로 생성**하라
- 전역 변수로 저장하지 마라 (Fluid compute 환경에서 문제 발생)
- `lib/supabase/server.ts`의 `createClient()` 함수를 사용하라

### 1.3 Client Components에서 Supabase 클라이언트 사용

**✅ 올바른 예시:**
```typescript
'use client';

import { createClient } from "@/lib/supabase/client";

export default function ClientComponent() {
  const supabase = createClient();

  const handleClick = async () => {
    const { data } = await supabase.from('users').select();
  };

  return <button onClick={handleClick}>Load Data</button>;
}
```

**❌ 잘못된 예시:**
```typescript
'use client';

// Server용 클라이언트를 Client Component에서 사용 금지!
import { createClient } from "@/lib/supabase/server";

export default function ClientComponent() {
  const supabase = await createClient(); // 에러!
  return <div>{/* ... */}</div>;
}
```

**규칙:**
- Client Components에서는 `lib/supabase/client.ts`의 `createClient()`를 사용하라
- `'use client'` 지시어를 파일 상단에 추가하라
- Server용 클라이언트를 Client Component에서 사용하지 마라

### 1.4 Middleware 수정 시 주의사항

**⚠️ 절대 금지:**
- `lib/supabase/middleware.ts`의 `createServerClient`와 `supabase.auth.getClaims()` 사이에 코드를 추가하지 마라
- 이를 위반하면 사용자가 무작위로 로그아웃될 수 있음

**✅ 올바른 패턴 (새 Response 생성 시):**
```typescript
const myNewResponse = NextResponse.next({ request });
myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll());
return myNewResponse;
```

**규칙:**
- `lib/supabase/middleware.ts`의 `updateSession()` 함수를 직접 수정하지 마라
- 미들웨어 로직 변경이 필요하면 `middleware.ts`에서 처리하라
- 반드시 쿠키를 복사하라

## 2. 파일 구조 및 경로 규칙

### 2.1 경로 별칭

**반드시 `@/*` 경로 별칭을 사용하라:**

**✅ 올바른 예시:**
```typescript
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

**❌ 잘못된 예시:**
```typescript
import { createClient } from "../../lib/supabase/server";
import { Button } from "../components/ui/button";
```

### 2.2 디렉토리 구조

**프로젝트 구조를 따라 파일을 배치하라:**

```
app/
├── auth/              # 인증 관련 페이지
│   ├── login/
│   ├── sign-up/
│   ├── forgot-password/
│   ├── confirm/       # 이메일 확인 Route Handler
│   └── callback/      # OAuth 콜백 Route Handler
├── protected/         # 인증이 필요한 페이지
├── layout.tsx         # 루트 레이아웃
└── page.tsx           # 홈 페이지

components/
├── ui/                # shadcn/ui 컴포넌트
├── tutorial/          # 튜토리얼 컴포넌트
└── [feature-name]/    # 기능별 컴포넌트

lib/
├── supabase/          # Supabase 클라이언트
│   ├── server.ts      # Server용
│   ├── client.ts      # Client용
│   └── middleware.ts  # Middleware용
└── utils.ts           # 유틸리티 함수
```

**규칙:**
- 새 페이지는 `app/` 디렉토리에 생성하라
- 재사용 가능한 컴포넌트는 `components/`에 생성하라
- shadcn/ui 컴포넌트는 `components/ui/`에 배치하라
- 유틸리티 함수는 `lib/utils.ts`에 추가하라

### 2.3 파일 명명 규칙

**파일명은 kebab-case를 사용하라:**
- ✅ `user-profile.tsx`
- ✅ `login-form.tsx`
- ❌ `UserProfile.tsx`
- ❌ `loginForm.tsx`

**컴포넌트명은 PascalCase를 사용하라:**
```typescript
// 파일: user-profile.tsx
export default function UserProfile() { /* ... */ }
```

## 3. 컴포넌트 작성 규칙

### 3.1 Server Components vs Client Components

**기본적으로 Server Components를 사용하라:**
- 데이터 페칭이 필요한 경우
- 민감한 정보(API 키 등)를 다루는 경우
- SEO가 중요한 경우

**Client Components는 다음 경우에만 사용하라:**
- 브라우저 API 사용 (useState, useEffect, localStorage 등)
- 이벤트 핸들러 사용 (onClick, onChange 등)
- React Hooks 사용

**✅ 올바른 예시:**
```typescript
// Server Component (기본)
import { createClient } from "@/lib/supabase/server";

export default async function UserList() {
  const supabase = await createClient();
  const { data: users } = await supabase.from('users').select();

  return <div>{/* ... */}</div>;
}
```

```typescript
// Client Component (필요한 경우만)
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 3.2 비동기 Server Components

**Server Components에서 데이터 페칭 시 async/await를 사용하라:**

**✅ 올바른 예시:**
```typescript
import { createClient } from "@/lib/supabase/server";

export default async function UserProfile({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select()
    .eq('id', params.id)
    .single();

  return <div>{user.name}</div>;
}
```

## 4. 인증 및 보호된 라우트 규칙

### 4.1 인증 흐름

**인증 확인은 `middleware.ts`에서 자동으로 처리된다:**

- 미들웨어는 모든 요청을 가로챈다
- 인증되지 않은 사용자는 `/auth/login`으로 리다이렉트된다
- `/auth/*` 경로는 미들웨어 검사를 건너뛴다

### 4.2 보호된 페이지 생성

**인증이 필요한 페이지는 `/protected` 또는 다른 경로에 생성하라:**

**✅ 올바른 예시:**
```typescript
// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 미들웨어에서 이미 인증 확인했으므로 user는 항상 존재
  const { data: { user } } = await supabase.auth.getUser();

  return <div>Welcome {user!.email}</div>;
}
```

**규칙:**
- 보호된 페이지에서 수동으로 인증 확인을 할 필요 없음
- 미들웨어가 자동으로 인증되지 않은 사용자를 리다이렉트함
- 로그인/회원가입 페이지는 `/auth/*` 경로에 생성하라

### 4.3 로그아웃 구현

**로그아웃은 Client Component에서 처리하라:**

**✅ 올바른 예시:**
```typescript
'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return <button onClick={handleLogout}>로그아웃</button>;
}
```

## 5. shadcn/ui 컴포넌트 사용 규칙

### 5.1 컴포넌트 설치

**새 shadcn/ui 컴포넌트 추가 시:**
```bash
npx shadcn@latest add [component-name]
```

**예시:**
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

### 5.2 컴포넌트 임포트

**shadcn/ui 컴포넌트는 `@/components/ui/`에서 임포트하라:**

**✅ 올바른 예시:**
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
```

### 5.3 스타일 규칙

**이 프로젝트는 `new-york` 스타일을 사용한다:**
- `components.json`에 정의된 스타일 설정을 유지하라
- 새 컴포넌트 추가 시 자동으로 `new-york` 스타일이 적용됨

### 5.4 아이콘 사용

**lucide-react 아이콘을 사용하라:**

**✅ 올바른 예시:**
```typescript
import { ChevronRight, User, Settings } from "lucide-react";

export function MyComponent() {
  return (
    <div>
      <User className="h-4 w-4" />
      <Settings className="h-6 w-6" />
    </div>
  );
}
```

## 6. 스타일링 규칙

### 6.1 Tailwind CSS 사용

**Tailwind CSS 유틸리티 클래스를 사용하라:**

**✅ 올바른 예시:**
```typescript
export function Card() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-2xl font-bold">제목</h2>
      <p className="text-muted-foreground">내용</p>
    </div>
  );
}
```

**규칙:**
- 인라인 스타일(`style={{}}`)을 사용하지 마라
- Tailwind 유틸리티 클래스를 우선 사용하라
- 커스텀 CSS는 `app/globals.css`에 추가하라

### 6.2 조건부 클래스

**`cn()` 유틸리티 함수를 사용하라:**

**✅ 올바른 예시:**
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

**❌ 잘못된 예시:**
```typescript
// 문자열 연결 사용 금지
<button className={`rounded-md ${isActive ? "bg-primary" : "bg-secondary"}`}>
```

## 7. 다크 모드 규칙

### 7.1 테마 전환

**이 프로젝트는 next-themes를 사용한다:**
- `app/layout.tsx`에 `ThemeProvider`가 설정되어 있음
- 시스템 설정에 따라 자동으로 다크 모드가 적용됨

### 7.2 테마 사용

**Client Component에서 테마를 변경하려면:**

**✅ 올바른 예시:**
```typescript
'use client';

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      테마 전환
    </button>
  );
}
```

**규칙:**
- Tailwind의 `dark:` 접두사를 사용하여 다크 모드 스타일을 정의하라
- 예: `className="bg-white dark:bg-black"`

## 8. TypeScript 규칙

### 8.1 타입 안전성

**타입을 명시적으로 정의하라:**

**✅ 올바른 예시:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

export async function getUser(id: string): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select()
    .eq('id', id)
    .single();

  return data;
}
```

**규칙:**
- `any` 타입 사용을 피하라
- 함수의 매개변수와 반환 타입을 명시하라
- TypeScript 엄격 모드가 활성화되어 있음 (`tsconfig.json`)

### 8.2 Supabase 데이터베이스 타입

**Supabase 타입은 `lib/supabase/database.types.ts`에 정의되어 있다:**

**✅ 올바른 예시:**
```typescript
import { Database } from "@/lib/supabase/database.types";

type User = Database['public']['Tables']['users']['Row'];
```

## 9. 코드 품질 규칙

### 9.1 코드 스타일

**커밋 전에 자동으로 검사된다:**
- Husky pre-commit 훅이 설정되어 있음
- ESLint와 Prettier가 자동으로 실행됨

**수동으로 검사하려면:**
```bash
npm run check-all  # TypeScript + ESLint + Prettier 검사
npm run lint:fix   # ESLint 자동 수정
npm run format     # Prettier 자동 포맷팅
```

### 9.2 주석 및 문서화

**주석은 한국어로 작성하라:**

**✅ 올바른 예시:**
```typescript
/**
 * 사용자 정보를 가져오는 함수
 * @param userId 사용자 ID
 * @returns 사용자 객체 또는 null
 */
export async function getUser(userId: string) {
  // 데이터베이스에서 사용자 조회
  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .single();

  return data;
}
```

**규칙:**
- 복잡한 로직에는 주석을 추가하라
- 함수에는 JSDoc 스타일의 주석을 사용하라
- 변수명과 함수명은 영어로 작성하라 (코드 표준 준수)

## 10. 환경 변수 규칙

### 10.1 필수 환경 변수

**프로젝트에는 다음 환경 변수가 필요하다:**

```env
NEXT_PUBLIC_SUPABASE_URL=[Supabase 프로젝트 URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[Supabase Anon Key]
```

**규칙:**
- `.env.local` 파일에 환경 변수를 저장하라
- `.env.local`은 Git에 커밋하지 마라 (`.gitignore`에 포함됨)
- 환경 변수가 없으면 미들웨어가 자동으로 건너뜀

### 10.2 환경 변수 사용

**Next.js 환경 변수 접근 방식을 따르라:**
- 클라이언트에서 접근: `NEXT_PUBLIC_` 접두사 필요
- 서버에서만 접근: 접두사 없이 사용 가능

## 11. 금지 사항 ❌

### 11.1 절대 하지 말아야 할 것들

1. **Supabase 클라이언트를 전역 변수로 저장하지 마라**
   - Server Components에서 매번 새로 생성해야 함

2. **Server용 Supabase 클라이언트를 Client Component에서 사용하지 마라**
   - `lib/supabase/server.ts`는 Server 전용
   - `lib/supabase/client.ts`는 Client 전용

3. **`lib/supabase/middleware.ts`의 중요 섹션에 코드를 추가하지 마라**
   - `createServerClient`와 `getClaims()` 사이

4. **상대 경로로 임포트하지 마라**
   - 항상 `@/*` 경로 별칭 사용

5. **인라인 스타일을 사용하지 마라**
   - Tailwind CSS 유틸리티 클래스 사용

6. **`any` 타입을 남용하지 마라**
   - 명시적인 타입 정의 사용

7. **환경 변수를 Git에 커밋하지 마라**
   - `.env.local`은 `.gitignore`에 포함

8. **불필요하게 Client Component를 만들지 마라**
   - 기본적으로 Server Components 사용

9. **shadcn/ui 컴포넌트를 수동으로 생성하지 마라**
   - `npx shadcn@latest add [component-name]` 사용

10. **커밋 전 검사를 건너뛰지 마라**
    - Husky 훅이 자동으로 실행됨

## 12. 다중 파일 조정 규칙

### 12.1 인증 관련 수정

**인증 로직을 수정할 때 다음 파일들을 함께 확인하라:**
- `lib/supabase/middleware.ts` - 인증 확인 로직
- `middleware.ts` - 보호된 경로 설정
- `app/auth/*/page.tsx` - 인증 페이지들

### 12.2 레이아웃 수정

**전역 레이아웃을 수정할 때:**
- `app/layout.tsx` - 루트 레이아웃
- `app/globals.css` - 전역 스타일
- `components/theme-switcher.tsx` - 테마 전환 컴포넌트

### 12.3 UI 컴포넌트 추가

**새 UI 컴포넌트를 추가할 때:**
1. `npx shadcn@latest add [component-name]` 실행
2. `components/ui/[component-name].tsx` 파일 자동 생성됨
3. 필요시 `components.json` 확인

## 13. 작업 완료 체크리스트

**코드 작성 완료 후 반드시 확인하라:**

```bash
# 1. 타입 체크
npm run typecheck

# 2. 린트 체크
npm run lint

# 3. 포맷 체크
npm run format:check

# 4. 통합 검사 (권장)
npm run check-all

# 5. 빌드 테스트
npm run build
```

**모든 검사가 통과되어야 커밋할 수 있다.**

---

## 요약

이 프로젝트에서 가장 중요한 규칙:

1. **Supabase 클라이언트를 올바르게 사용하라** (Server/Client 구분)
2. **`@/*` 경로 별칭을 사용하라**
3. **기본적으로 Server Components를 사용하라**
4. **shadcn/ui를 통해 UI 컴포넌트를 추가하라**
5. **Tailwind CSS와 `cn()` 유틸리티를 사용하라**
6. **커밋 전에 `npm run check-all`을 실행하라**
7. **TypeScript 타입을 명시적으로 정의하라**
8. **주석과 문서는 한국어로 작성하라**

이 규칙들을 따르면 일관되고 유지보수 가능한 코드를 작성할 수 있다.
