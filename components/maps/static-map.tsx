"use client";

import { MapPin, ExternalLink } from "lucide-react";
import { NaverMap } from "./naver-map";

interface StaticMapProps {
  /** 주소 */
  address: string;
  /** 위도 */
  latitude?: number | null;
  /** 경도 */
  longitude?: number | null;
  /** 지도 높이 */
  height?: string;
  /** 클래스명 */
  className?: string;
}

/**
 * 정적 지도 컴포넌트 (상세 페이지용)
 *
 * 좌표가 있으면 지도를, 없으면 주소 텍스트만 표시합니다.
 * 지도/주소 클릭 시 네이버 지도 앱으로 이동합니다.
 */
export function StaticMap({
  address,
  latitude,
  longitude,
  height = "h-48",
  className = "",
}: StaticMapProps) {
  const hasCoordinates = latitude !== null && latitude !== undefined &&
                         longitude !== null && longitude !== undefined;

  // 네이버 지도 딥링크 생성
  const getNaverMapUrl = () => {
    if (hasCoordinates) {
      // 네이버 지도 앱 딥링크 (웹으로 폴백)
      return `https://map.naver.com/v5/search/${encodeURIComponent(address)}?c=${longitude},${latitude},15,0,0,0,dh`;
    }
    // 좌표가 없으면 주소로 검색
    return `https://map.naver.com/v5/search/${encodeURIComponent(address)}`;
  };

  // 지도 열기
  const handleOpenMap = () => {
    window.open(getNaverMapUrl(), "_blank", "noopener,noreferrer");
  };

  // 좌표가 없는 경우 - 주소 텍스트만 표시
  if (!hasCoordinates) {
    return (
      <button
        type="button"
        onClick={handleOpenMap}
        className={`flex w-full items-center gap-2 rounded-lg border bg-muted/50 p-4 text-left transition-colors hover:bg-muted ${className}`}
      >
        <MapPin className="h-5 w-5 shrink-0 text-primary" />
        <span className="flex-1 text-sm">{address}</span>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    );
  }

  // 좌표가 있는 경우 - 지도 표시
  return (
    <div className={`space-y-2 ${className}`}>
      {/* 클릭 가능한 지도 */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenMap}
        onKeyDown={(e) => e.key === "Enter" && handleOpenMap()}
        className="cursor-pointer overflow-hidden rounded-lg transition-opacity hover:opacity-90"
      >
        <NaverMap
          center={{ lat: latitude, lng: longitude }}
          showMarker={true}
          showZoomControl={false}
          height={height}
        />
      </div>

      {/* 주소 및 네이버 지도 열기 버튼 */}
      <button
        type="button"
        onClick={handleOpenMap}
        className="flex w-full items-center gap-2 rounded-lg border bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
      >
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <span className="flex-1 truncate text-sm">{address}</span>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          지도 앱에서 보기
        </span>
      </button>
    </div>
  );
}
