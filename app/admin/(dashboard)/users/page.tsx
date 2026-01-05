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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAdminUsersAction, deleteUserByAdminAction } from "@/app/actions/admin";
import { formatDateShort, getInitials } from "@/lib/utils/format";
import type { UserTableRow } from "@/lib/types/admin";

/**
 * 사용자 관리 페이지
 *
 * 사용자 목록을 테이블로 표시하고, 검색, 필터링, 삭제 기능을 제공합니다.
 * 실제 백엔드 데이터를 조회하여 표시합니다.
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");

  /**
   * 사용자 목록 조회
   */
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const result = await getAdminUsersAction({
        searchQuery,
        roleFilter,
        sortBy: "created_at",
        sortOrder: "desc",
        page: 1,
        pageSize: 100,
      });

      if (result.success && result.data) {
        setUsers(result.data.data);
      } else {
        console.error("사용자 목록 조회 실패:", result.message);
        alert(result.message || "사용자 목록을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("사용자 목록 조회 오류:", error);
      alert("사용자 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 컴포넌트 마운트 시 및 필터 변경 시 데이터 조회
   */
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, roleFilter]);

  /**
   * 사용자 삭제 핸들러
   */
  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`"${userName}" 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteUserByAdminAction(userId);

      if (result.success) {
        alert(result.message);
        fetchUsers();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("사용자 삭제 오류:", error);
      alert("사용자 삭제 중 오류가 발생했습니다.");
    }
  };

  /**
   * 권한별 Badge 컴포넌트 반환
   */
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">관리자</Badge>;
      case "user":
      default:
        return <Badge variant="default">사용자</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h1 className="text-3xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground">모든 사용자를 관리하고 권한을 조정하세요</p>
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
              placeholder="이름 또는 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 권한 필터 */}
          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as "all" | "user" | "admin")}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="권한 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="user">사용자</SelectItem>
              <SelectItem value="admin">관리자</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 사용자 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록 ({users.length})</CardTitle>
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
                    <TableHead>사용자</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>권한</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>생성 이벤트</TableHead>
                    <TableHead>참여 이벤트</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={user.avatar_url ?? undefined}
                                alt={user.username ?? ""}
                              />
                              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{formatDateShort(user.created_at)}</TableCell>
                        <TableCell>{user.created_events_count}개</TableCell>
                        <TableCell>{user.participated_events_count}개</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id, user.username || "알 수 없음")}
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
