"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/lib/types/admin";

/**
 * 이벤트 생성 추이 차트 Props
 */
interface EventTrendChartProps {
  /** 차트 데이터 (날짜별 이벤트 수) */
  data: ChartDataPoint[];
}

/**
 * 이벤트 생성 추이 차트 컴포넌트
 *
 * 일별 이벤트 생성 수를 LineChart로 시각화합니다.
 */
export function EventTrendChart({ data }: EventTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
          className="text-xs"
        />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
          labelFormatter={(value) => {
            const date = new Date(value);
            return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))" }}
          name="이벤트 수"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
