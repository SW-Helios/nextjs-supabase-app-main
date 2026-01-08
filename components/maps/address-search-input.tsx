"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/lib/types/maps";

interface AddressSearchInputProps {
  /** 초기 값 */
  value?: string;
  /** 값 변경 핸들러 */
  onChange?: (address: string) => void;
  /** 주소 선택 핸들러 */
  onSelect?: (result: SearchResult) => void;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 비활성화 */
  disabled?: boolean;
  /** 클래스명 */
  className?: string;
}

/**
 * 주소 검색 입력 컴포넌트
 *
 * 텍스트 입력과 자동완성 드롭다운을 제공합니다.
 * debounce(300ms)로 API 호출을 최적화합니다.
 */
export function AddressSearchInput({
  value = "",
  onChange,
  onSelect,
  placeholder = "주소를 검색하세요",
  disabled = false,
  className,
}: AddressSearchInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 검색 수행
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/maps/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.status === "OK" && data.results) {
        setResults(data.results);
        setIsOpen(true);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("[AddressSearch] 검색 실패:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 입력 변경 핸들러 (debounce 적용)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    onChange?.(newValue);

    // 기존 타이머 취소
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 새 타이머 설정 (300ms debounce)
    debounceRef.current = setTimeout(() => {
      performSearch(newValue);
    }, 300);
  };

  // 결과 선택 핸들러
  const handleSelect = (result: SearchResult) => {
    const address = result.roadAddress || result.jibunAddress;
    setInputValue(address);
    setIsOpen(false);
    setResults([]);
    onChange?.(address);
    onSelect?.(result);
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  // 포커스 아웃 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // value prop 동기화
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 클린업
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* 검색 입력 */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-9 pl-9"
        />
        {isLoading && (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="bg-popover absolute z-50 mt-1 w-full rounded-md border shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {results.map((result, index) => (
              <li
                key={index}
                className={cn(
                  "hover:bg-accent cursor-pointer px-3 py-2 text-sm transition-colors",
                  selectedIndex === index && "bg-accent"
                )}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{result.roadAddress}</p>
                    {result.jibunAddress && (
                      <p className="text-muted-foreground truncate text-xs">
                        (지번) {result.jibunAddress}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {isOpen && results.length === 0 && inputValue.length >= 2 && !isLoading && (
        <div className="bg-popover absolute z-50 mt-1 w-full rounded-md border p-3 shadow-lg">
          <p className="text-muted-foreground text-center text-sm">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}
