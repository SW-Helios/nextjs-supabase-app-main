"use client";

import { useEffect, useRef, useState } from "react";
import { NaverMapScript } from "./naver-map-script";
import { useNaverMap } from "@/lib/hooks/use-naver-map";
import { Loader2, MapPin } from "lucide-react";

interface NaverMapProps {
  /** 중심 좌표 */
  center?: { lat: number; lng: number };
  /** 줌 레벨 */
  zoom?: number;
  /** 마커 표시 여부 */
  showMarker?: boolean;
  /** 줌 컨트롤 표시 여부 */
  showZoomControl?: boolean;
  /** 지도 높이 */
  height?: string;
  /** 클래스명 */
  className?: string;
  /** 지도 클릭 이벤트 */
  onClick?: (lat: number, lng: number) => void;
  /** 지도 로드 완료 이벤트 */
  onMapLoad?: () => void;
}

// 서울시청 기본 좌표
const DEFAULT_CENTER = { lat: 37.5666805, lng: 126.9784147 };

/**
 * 네이버 지도 컴포넌트
 *
 * 네이버 지도를 렌더링하고 마커를 표시합니다.
 */
export function NaverMap({
  center = DEFAULT_CENTER,
  zoom = 15,
  showMarker = true,
  showZoomControl = true,
  height = "h-48",
  className = "",
  onClick,
  onMapLoad,
}: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const { map, marker, isMapLoaded, error, initializeMap, setMarkerPosition, setCenter } =
    useNaverMap({
      center,
      zoom,
      isScriptLoaded,
      showZoomControl,
    });

  // 스크립트 로드 완료 핸들러
  const handleScriptLoad = () => {
    setIsScriptLoaded(true);
  };

  // 스크립트 로드 후 지도 초기화
  useEffect(() => {
    if (isScriptLoaded && containerRef.current && !map) {
      initializeMap(containerRef.current);
    }
  }, [isScriptLoaded, initializeMap, map]);

  // center prop 변경 시 지도 중심 및 마커 업데이트
  useEffect(() => {
    if (map && isMapLoaded) {
      setCenter(center.lat, center.lng);
      if (showMarker) {
        setMarkerPosition(center.lat, center.lng);
      }
    }
  }, [center.lat, center.lng, map, isMapLoaded, setCenter, setMarkerPosition, showMarker]);

  // 지도 클릭 이벤트 등록
  useEffect(() => {
    if (!map || !onClick || !window.naver?.maps) return;

    window.naver.maps.Event.addListener(map, "click", (e) => {
      const lat = e.coord.lat();
      const lng = e.coord.lng();
      onClick(lat, lng);

      // 마커 위치 업데이트
      if (showMarker) {
        setMarkerPosition(lat, lng);
      }
    });
  }, [map, onClick, showMarker, setMarkerPosition]);

  // 지도 로드 완료 콜백
  useEffect(() => {
    if (isMapLoaded && onMapLoad) {
      onMapLoad();
    }
  }, [isMapLoaded, onMapLoad]);

  // 마커 표시/숨김
  useEffect(() => {
    if (marker && window.naver?.maps) {
      marker.setMap(showMarker ? map : null);
    }
  }, [showMarker, marker, map]);

  // API 키가 없는 경우 플레이스홀더 표시
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  if (!clientId || clientId === "your_client_id_here") {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg border bg-muted ${height} ${className}`}
      >
        <MapPin className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">지도 API 키가 필요합니다</p>
      </div>
    );
  }

  return (
    <>
      <NaverMapScript onLoad={handleScriptLoad} />

      <div className={`relative overflow-hidden rounded-lg ${height} ${className}`}>
        {/* 로딩 상태 */}
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* 지도 컨테이너 */}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </>
  );
}
