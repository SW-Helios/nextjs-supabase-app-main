import { NextRequest, NextResponse } from "next/server";

/**
 * 네이버 지역 검색 API (Local Search)
 *
 * 키워드로 장소를 검색합니다.
 * - GET /api/maps/search?query=스타벅스+강남
 *
 * 참고: 네이버 검색 API를 사용합니다.
 * https://api.ncloud-docs.com/docs/ai-naver-mapsearchplaces
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
      console.error("[Search] 네이버 지도 API 키가 설정되지 않았습니다.");
      return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
    }

    // 네이버 Geocoding API로 대체 (Local Search API는 별도 신청 필요)
    // Geocoding API로 주소 검색을 수행합니다
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
      console.error("[Search] API 요청 실패:", response.status);
      return NextResponse.json({ error: "장소 검색에 실패했습니다." }, { status: response.status });
    }

    const data = await response.json();

    // 결과가 없는 경우
    if (data.status === "ZERO_RESULTS" || !data.addresses || data.addresses.length === 0) {
      return NextResponse.json({
        status: "ZERO_RESULTS",
        results: [],
      });
    }

    // 결과 변환
    const results = data.addresses.map(
      (addr: { roadAddress: string; jibunAddress: string; y: string; x: string }) => ({
        roadAddress: addr.roadAddress,
        jibunAddress: addr.jibunAddress,
        lat: parseFloat(addr.y),
        lng: parseFloat(addr.x),
      })
    );

    return NextResponse.json({
      status: "OK",
      results,
    });
  } catch (error) {
    console.error("[Search] 예외 발생:", error);
    return NextResponse.json({ error: "장소 검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
