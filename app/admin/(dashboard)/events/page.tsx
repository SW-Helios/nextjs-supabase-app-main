"use client";

import { useEffect, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminEventsAction, deleteEventByAdminAction } from "@/app/actions/admin";
import { formatDateShort } from "@/lib/utils/format";
import type { EventTableRow } from "@/lib/types/admin";

/**
 * 이벤트 관리 페이지
 *
 * 이벤트 목록을 테이블로 표시하고, 검색, 필터링, 삭제 기능을 제공합니다.
 * 실제 백엔드 데이터를 조회하여 표시합니다.
 */
export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cancelled" | "completed">(
    "all"
  );

  /**
   * 이벤트 목록 조회
   */
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const result = await getAdminEventsAction({
        searchQuery,
        statusFilter,
        sortBy: "created_at",
        sortOrder: "desc",
        page: 1,
        pageSize: 100, // 페이지네이션 구현 전까지는 큰 값 사용
      });

      if (result.success && result.data) {
        setEvents(result.data.data);
      } else {
        console.error("이벤트 목록 조회 실패:", result.message);
        alert(result.message || "이벤트 목록을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("이벤트 목록 조회 오류:", error);
      alert("이벤트 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 컴포넌트 마운트 시 및 필터 변경 시 데이터 조회
   */
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter]);

  /**
   * 이벤트 삭제 핸들러
   */
  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!confirm(`"${eventTitle}" 이벤트를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteEventByAdminAction(eventId);

      if (result.success) {
        alert(result.message);
        // 이벤트 목록 새로고침
        fetchEvents();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("이벤트 삭제 오류:", error);
      alert("이벤트 삭제 중 오류가 발생했습니다.");
    }
  };

  /**
   * 상태별 Badge 컴포넌트 반환
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">진행 중</Badge>;
      case "completed":
        return <Badge variant="outline">종료</Badge>;
      case "cancelled":
        return <Badge variant="destructive">취소됨</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h1 className="text-3xl font-bold">이벤트 관리</h1>
        <p className="text-muted-foreground">모든 이벤트를 관리하고 모니터링하세요</p>
      </div>

      {/* 필터 툴바 */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          {/* 검색 입력 */}
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="제목 또는 초대 코드로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 상태 필터 */}
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "all" | "active" | "cancelled" | "completed")
            }
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="active">진행 중</SelectItem>
              <SelectItem value="completed">종료</SelectItem>
              <SelectItem value="cancelled">취소됨</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 이벤트 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>이벤트 목록 ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>초대 코드</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>호스트</TableHead>
                    <TableHead>참여자</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length > 0 ? (
                    events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>
                          <code className="bg-muted rounded px-2 py-1 text-sm">
                            {event.invite_code}
                          </code>
                        </TableCell>
                        <TableCell>{formatDateShort(event.event_date)}</TableCell>
                        <TableCell>{getStatusBadge(event.status)}</TableCell>
                        <TableCell>{event.host_name}</TableCell>
                        <TableCell>{event.participant_count}명</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(event.id, event.title)}
                          >
                            <Trash2 className="text-destructive h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                        검색 결과가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
