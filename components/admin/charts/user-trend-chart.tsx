"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/lib/types/admin";

/**
 * 사용자 가입 추이 차트 Props
 */
interface UserTrendChartProps {
  /** 차트 데이터 (날짜별 사용자 수) */
  data: ChartDataPoint[];
}

/**
 * 사용자 가입 추이 차트 컴포넌트
 *
 * 일별 사용자 가입 수를 AreaChart로 시각화합니다.
 */
export function UserTrendChart({ data }: UserTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
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
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
          name="신규 사용자"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
