"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/**
 * 인기 이벤트 TOP 5 차트 Props
 */
interface TopEventsChartProps {
  /** 차트 데이터 (이벤트명과 참여자 수) */
  data: { name: string; participants: number }[];
}

/**
 * 인기 이벤트 TOP 5 차트 컴포넌트
 *
 * 참여자 수가 많은 상위 5개 이벤트를 BarChart로 시각화합니다.
 */
export function TopEventsChart({ data }: TopEventsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" className="text-xs" />
        <YAxis
          dataKey="name"
          type="category"
          width={150}
          className="text-xs"
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        <Bar dataKey="participants" fill="hsl(var(--primary))" name="참여자 수" />
      </BarChart>
    </ResponsiveContainer>
  );
}
