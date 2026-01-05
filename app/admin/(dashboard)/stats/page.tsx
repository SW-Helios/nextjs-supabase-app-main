"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventTrendChart } from "@/components/admin/charts/event-trend-chart";
import { EventStatusChart } from "@/components/admin/charts/event-status-chart";
import { UserTrendChart } from "@/components/admin/charts/user-trend-chart";
import { TopEventsChart } from "@/components/admin/charts/top-events-chart";
import { getEventStatsAction } from "@/app/actions/admin";
import type { EventStats } from "@/lib/types/admin";
import { eventStatusData, topEventsData } from "@/lib/data";

/**
 * 통계 분석 페이지
 *
 * 4개의 차트로 이벤트 및 사용자 통계를 시각화합니다.
 * 실제 백엔드 데이터를 조회하여 표시합니다.
 */
export default function AdminStatsPage() {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 통계 데이터 조회
   */
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const result = await getEventStatsAction();

        if (result.success && result.data) {
          setStats(result.data);
        } else {
          console.error("통계 데이터 조회 실패:", result.message);
          alert(result.message || "통계 데이터를 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("통계 데이터 조회 오류:", error);
        alert("통계 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* 페이지 제목 */}
      <div>
        <h1 className="text-3xl font-bold">통계 분석</h1>
        <p className="text-muted-foreground">이벤트와 사용자 데이터를 시각적으로 분석하세요</p>
      </div>

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 이벤트 생성 추이 */}
          <Card>
            <CardHeader>
              <CardTitle>이벤트 생성 추이 (최근 30일)</CardTitle>
            </CardHeader>
            <CardContent>
              <EventTrendChart data={stats.event_trend} />
            </CardContent>
          </Card>

          {/* 이벤트 상태 분포 (더미 데이터 유지) */}
          <Card>
            <CardHeader>
              <CardTitle>이벤트 상태 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <EventStatusChart data={eventStatusData} />
            </CardContent>
          </Card>

          {/* 사용자 가입 추이 */}
          <Card>
            <CardHeader>
              <CardTitle>사용자 가입 추이 (최근 30일)</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTrendChart data={stats.user_trend} />
            </CardContent>
          </Card>

          {/* 인기 이벤트 TOP 5 (더미 데이터 유지) */}
          <Card>
            <CardHeader>
              <CardTitle>인기 이벤트 TOP 5</CardTitle>
            </CardHeader>
            <CardContent>
              <TopEventsChart data={topEventsData} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">통계 데이터를 불러올 수 없습니다.</p>
        </div>
      )}
    </div>
  );
}
