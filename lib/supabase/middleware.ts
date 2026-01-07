import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // =============================================
  // 관리자 페이지 접근 제어
  // =============================================
  // 테스트 시나리오:
  // 1. 미인증 사용자 → /admin/login 리다이렉트
  // 2. 일반 사용자 (인증됨, role !== 'admin') → / 리다이렉트
  // 3. 관리자 사용자 (role === 'admin') → 정상 접근
  // =============================================
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // /admin/login 페이지는 항상 접근 허용
    if (request.nextUrl.pathname === "/admin/login") {
      return supabaseResponse;
    }

    // 시나리오 1: 미인증 사용자 → /admin/login 리다이렉트
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // 관리자 권한 확인
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.sub)
      .single();

    // 프로필 조회 실패 시 홈으로 리다이렉트
    if (error) {
      console.error("[Admin] 프로필 조회 실패:", error.message);
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // 시나리오 2: 일반 사용자 (인증됨, role !== 'admin') → / 리다이렉트
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // 시나리오 3: 관리자 사용자 → 정상 접근 (아래로 통과)
  }

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api/og") &&
    !request.nextUrl.pathname.startsWith("/invite")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    console.log("no user, redirecting to login page");
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // 원래 요청 경로를 redirect 쿼리 파라미터로 보존
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
