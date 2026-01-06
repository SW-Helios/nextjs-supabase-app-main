"use client";

import { useState, useEffect, useCallback } from "react";
import { AddressSearchInput } from "./address-search-input";
import { NaverMap } from "./naver-map";
import type { SearchResult, LocationData } from "@/lib/types/maps";

interface LocationPickerProps {
  /** 초기 위치 데이터 */
  initialValue?: LocationData;
  /** 위치 변경 핸들러 */
  onChange?: (location: LocationData) => void;
  /** 비활성화 */
  disabled?: boolean;
  /** 지도 높이 */
  mapHeight?: string;
}

// 서울시청 기본 좌표
const DEFAULT_CENTER = { lat: 37.5666805, lng: 126.9784147 };

/**
 * 장소 선택 통합 컴포넌트
 *
 * AddressSearchInput과 NaverMap을 통합하여
 * 주소 검색 및 지도 마커 선택 기능을 제공합니다.
 */
export function LocationPicker({
  initialValue,
  onChange,
  disabled = false,
  mapHeight = "h-48",
}: LocationPickerProps) {
  const [address, setAddress] = useState(initialValue?.address || "");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialValue?.latitude && initialValue?.longitude
      ? { lat: initialValue.latitude, lng: initialValue.longitude }
      : null
  );
  const [mapCenter, setMapCenter] = useState(
    coordinates || DEFAULT_CENTER
  );

  // 주소 선택 핸들러
  const handleAddressSelect = useCallback((result: SearchResult) => {
    const newAddress = result.roadAddress || result.jibunAddress;
    const newCoordinates = { lat: result.lat, lng: result.lng };

    setAddress(newAddress);
    setCoordinates(newCoordinates);
    setMapCenter(newCoordinates);

    onChange?.({
      address: newAddress,
      latitude: result.lat,
      longitude: result.lng,
    });
  }, [onChange]);

  // 주소 텍스트만 변경 (좌표 없음)
  const handleAddressChange = useCallback((newAddress: string) => {
    setAddress(newAddress);

    // 주소만 변경되고 좌표는 유지
    onChange?.({
      address: newAddress,
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null,
    });
  }, [coordinates, onChange]);

  // 지도 클릭 핸들러 (역지오코딩은 미구현, 좌표만 업데이트)
  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newCoordinates = { lat, lng };
    setCoordinates(newCoordinates);

    onChange?.({
      address,
      latitude: lat,
      longitude: lng,
    });
  }, [address, onChange]);

  // initialValue 변경 시 동기화
  useEffect(() => {
    if (initialValue) {
      setAddress(initialValue.address);
      if (initialValue.latitude && initialValue.longitude) {
        const coords = { lat: initialValue.latitude, lng: initialValue.longitude };
        setCoordinates(coords);
        setMapCenter(coords);
      }
    }
  }, [initialValue]);

  return (
    <div className="space-y-3">
      {/* 주소 검색 입력 */}
      <AddressSearchInput
        value={address}
        onChange={handleAddressChange}
        onSelect={handleAddressSelect}
        placeholder="주소를 검색하세요 (예: 강남역, 서울시 강남구)"
        disabled={disabled}
      />

      {/* 지도 표시 */}
      <NaverMap
        center={mapCenter}
        showMarker={coordinates !== null}
        height={mapHeight}
        onClick={handleMapClick}
      />

      {/* 선택된 좌표 표시 (디버그용, 필요시 제거) */}
      {coordinates && (
        <p className="text-xs text-muted-foreground">
          좌표: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
