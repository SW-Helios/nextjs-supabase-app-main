import { NextRequest, NextResponse } from "next/server";
import type { GeocodingResponse } from "@/lib/types/maps";

/**
 * 네이버 Geocoding API 프록시
 *
 * 주소를 좌표(위도, 경도)로 변환합니다.
 * - GET /api/maps/geocode?query=서울시+강남구
 *
 * NCP API 키는 서버 사이드에서만 사용됩니다.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "검색어를 입력해주세요." }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[Geocoding] 네이버 지도 API 키가 설정되지 않았습니다.");
      return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
    }

    // 네이버 Geocoding API 호출
    const response = await fetch(
      `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`,
      {
        headers: {
          "X-NCP-APIGW-API-KEY-ID": clientId,
          "X-NCP-APIGW-API-KEY": clientSecret,
        },
      }
    );

    if (!response.ok) {
      console.error("[Geocoding] API 요청 실패:", response.status);
      return NextResponse.json({ error: "주소 검색에 실패했습니다." }, { status: response.status });
    }

    const data: GeocodingResponse = await response.json();

    // 결과가 없는 경우
    if (data.status === "ZERO_RESULTS" || data.addresses.length === 0) {
      return NextResponse.json({
        status: "ZERO_RESULTS",
        results: [],
      });
    }

    // 결과 변환 (간소화된 형태로)
    const results = data.addresses.map((addr) => ({
      roadAddress: addr.roadAddress,
      jibunAddress: addr.jibunAddress,
      lat: parseFloat(addr.y),
      lng: parseFloat(addr.x),
    }));

    return NextResponse.json({
      status: "OK",
      results,
    });
  } catch (error) {
    console.error("[Geocoding] 예외 발생:", error);
    return NextResponse.json({ error: "주소 검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
