"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

/**
 * 이벤트 상태 분포 차트 Props
 */
interface EventStatusChartProps {
  /** 차트 데이터 (상태별 이벤트 수) */
  data: { name: string; value: number }[];
}

/**
 * 상태별 색상 매핑
 */
const COLORS = [
  "hsl(var(--primary))", // 예정
  "hsl(var(--secondary))", // 진행 중
  "hsl(var(--muted))", // 종료
];

/**
 * 이벤트 상태 분포 차트 컴포넌트
 *
 * 이벤트 상태별 분포를 PieChart로 시각화합니다.
 */
export function EventStatusChart({ data }: EventStatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label
          outerRadius={80}
          fill="hsl(var(--primary))"
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
