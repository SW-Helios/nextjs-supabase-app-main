"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { NaverMapInstance, NaverMarkerInstance, NaverLatLng } from "@/lib/types/maps";

interface UseNaverMapOptions {
  /** 초기 중심 좌표 */
  center?: { lat: number; lng: number };
  /** 초기 줌 레벨 */
  zoom?: number;
  /** 스크립트 로드 완료 여부 */
  isScriptLoaded?: boolean;
  /** 줌 컨트롤 표시 여부 */
  showZoomControl?: boolean;
}

interface UseNaverMapReturn {
  /** 지도 인스턴스 */
  map: NaverMapInstance | null;
  /** 마커 인스턴스 */
  marker: NaverMarkerInstance | null;
  /** 지도 로드 상태 */
  isMapLoaded: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 지도 초기화 함수 */
  initializeMap: (container: HTMLElement) => void;
  /** 마커 위치 설정 */
  setMarkerPosition: (lat: number, lng: number) => void;
  /** 지도 중심 이동 */
  setCenter: (lat: number, lng: number) => void;
}

// 서울시청 기본 좌표
const DEFAULT_CENTER = { lat: 37.5666805, lng: 126.9784147 };
const DEFAULT_ZOOM = 15;

/**
 * 네이버 지도 커스텀 훅
 *
 * 지도 인스턴스와 마커를 관리합니다.
 */
export function useNaverMap(options: UseNaverMapOptions = {}): UseNaverMapReturn {
  const {
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    isScriptLoaded = false,
    showZoomControl = true,
  } = options;

  const [map, setMap] = useState<NaverMapInstance | null>(null);
  const [marker, setMarker] = useState<NaverMarkerInstance | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLElement | null>(null);
  const initializingRef = useRef(false);

  // 지도 초기화
  const initializeMap = useCallback(
    (container: HTMLElement) => {
      // 이미 초기화 중이거나 완료된 경우 스킵
      if (initializingRef.current || map) return;

      // 스크립트 로드 확인
      if (!window.naver?.maps) {
        setError("네이버 지도 API가 로드되지 않았습니다.");
        return;
      }

      initializingRef.current = true;
      containerRef.current = container;

      try {
        // 지도 인스턴스 생성
        const mapInstance = new window.naver.maps.Map(container, {
          center: new window.naver.maps.LatLng(center.lat, center.lng),
          zoom,
          zoomControl: showZoomControl,
          mapTypeControl: false,
          scrollWheel: true,
          draggable: true,
        });

        // 마커 인스턴스 생성
        const markerInstance = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(center.lat, center.lng),
          map: mapInstance,
        });

        setMap(mapInstance);
        setMarker(markerInstance);
        setIsMapLoaded(true);
        setError(null);
      } catch (err) {
        console.error("[useNaverMap] 지도 초기화 실패:", err);
        setError("지도를 초기화하는 데 실패했습니다.");
      } finally {
        initializingRef.current = false;
      }
    },
    [center.lat, center.lng, zoom, map, showZoomControl]
  );

  // 마커 위치 설정
  const setMarkerPosition = useCallback(
    (lat: number, lng: number) => {
      if (!marker || !window.naver?.maps) return;

      const position = new window.naver.maps.LatLng(lat, lng);
      marker.setPosition(position);
    },
    [marker]
  );

  // 지도 중심 이동
  const setCenter = useCallback(
    (lat: number, lng: number) => {
      if (!map || !window.naver?.maps) return;

      const position = new window.naver.maps.LatLng(lat, lng) as unknown as NaverLatLng;
      map.setCenter(position);
    },
    [map]
  );

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, [map]);

  // 스크립트 로드 후 자동 초기화
  useEffect(() => {
    if (isScriptLoaded && containerRef.current && !map) {
      initializeMap(containerRef.current);
    }
  }, [isScriptLoaded, initializeMap, map]);

  return {
    map,
    marker,
    isMapLoaded,
    error,
    initializeMap,
    setMarkerPosition,
    setCenter,
  };
}
