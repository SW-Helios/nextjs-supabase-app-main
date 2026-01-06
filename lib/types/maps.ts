/**
 * 네이버 지도 관련 타입 정의
 */

/**
 * 위치 데이터
 */
export interface LocationData {
  /** 주소 문자열 */
  address: string;
  /** 위도 */
  latitude: number | null;
  /** 경도 */
  longitude: number | null;
}

/**
 * 네이버 지도 Geocoding API 응답
 */
export interface GeocodingResponse {
  status: "OK" | "ZERO_RESULTS" | "ERROR";
  meta: {
    totalCount: number;
    page: number;
    count: number;
  };
  addresses: GeocodingAddress[];
  errorMessage?: string;
}

/**
 * Geocoding 주소 결과
 */
export interface GeocodingAddress {
  roadAddress: string;
  jibunAddress: string;
  englishAddress: string;
  x: string; // 경도 (longitude)
  y: string; // 위도 (latitude)
  addressElements: AddressElement[];
}

/**
 * 주소 요소
 */
export interface AddressElement {
  types: string[];
  longName: string;
  shortName: string;
  code: string;
}

/**
 * 장소 검색 결과
 */
export interface SearchResult {
  /** 도로명 주소 */
  roadAddress: string;
  /** 지번 주소 */
  jibunAddress: string;
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
}

/**
 * 네이버 지도 마커 정보
 */
export interface MapMarker {
  position: {
    lat: number;
    lng: number;
  };
  title?: string;
  icon?: string;
}

/**
 * 네이버 지도 옵션
 */
export interface NaverMapOptions {
  /** 중심 좌표 (NaverLatLng 객체) */
  center?: NaverLatLng;
  /** 줌 레벨 (1-21) */
  zoom?: number;
  /** 줌 컨트롤 표시 */
  zoomControl?: boolean;
  /** 지도 타입 컨트롤 표시 */
  mapTypeControl?: boolean;
  /** 스크롤 줌 활성화 */
  scrollWheel?: boolean;
  /** 드래그 활성화 */
  draggable?: boolean;
}

/**
 * 네이버 지도 API 전역 타입 (window.naver)
 */
declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (element: HTMLElement, options?: NaverMapOptions) => NaverMapInstance;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Marker: new (options: NaverMarkerOptions) => NaverMarkerInstance;
        Event: {
          addListener: (
            instance: NaverMapInstance | NaverMarkerInstance,
            eventName: string,
            handler: (e: NaverMouseEvent) => void
          ) => void;
        };
      };
    };
  }
}

/**
 * 네이버 지도 인스턴스
 */
export interface NaverMapInstance {
  setCenter: (latlng: NaverLatLng) => void;
  getCenter: () => NaverLatLng;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  destroy: () => void;
}

/**
 * 네이버 LatLng 객체
 */
export interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}

/**
 * 네이버 마커 옵션
 */
export interface NaverMarkerOptions {
  position: NaverLatLng;
  map?: NaverMapInstance;
  title?: string;
  icon?: string;
}

/**
 * 네이버 마커 인스턴스
 */
export interface NaverMarkerInstance {
  setPosition: (latlng: NaverLatLng) => void;
  getPosition: () => NaverLatLng;
  setMap: (map: NaverMapInstance | null) => void;
}

/**
 * 네이버 마우스 이벤트
 */
export interface NaverMouseEvent {
  coord: NaverLatLng;
  latlng: NaverLatLng;
}
