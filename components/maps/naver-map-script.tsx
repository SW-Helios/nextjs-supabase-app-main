"use client";

import Script from "next/script";

interface NaverMapScriptProps {
  onLoad?: () => void;
}

/**
 * 네이버 지도 스크립트 로더
 *
 * next/script를 사용하여 네이버 지도 API를 로드합니다.
 * afterInteractive 전략으로 페이지 로드 후 스크립트를 불러옵니다.
 */
export function NaverMapScript({ onLoad }: NaverMapScriptProps) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId || clientId === "your_client_id_here") {
    console.warn("[NaverMapScript] 네이버 지도 API 클라이언트 ID가 설정되지 않았습니다.");
    return null;
  }

  return (
    <Script
      src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
      strategy="afterInteractive"
      onLoad={onLoad}
    />
  );
}
