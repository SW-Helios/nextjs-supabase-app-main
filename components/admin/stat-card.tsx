import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * StatCard 컴포넌트 Props
 */
interface StatCardProps {
  /** 통계 항목 제목 */
  title: string;
  /** 통계 값 */
  value: number;
  /** 아이콘 컴포넌트 */
  icon: LucideIcon;
  /** 증감률 (선택사항, %) */
  change?: number;
  /** 단위 (선택사항, 예: "명", "개") */
  unit?: string;
}

/**
 * 통계 카드 컴포넌트
 *
 * 관리자 대시보드에서 KPI 지표를 표시하는 카드입니다.
 * 아이콘, 제목, 값, 증감률을 표시합니다.
 *
 * @param title - 통계 항목 제목
 * @param value - 통계 값
 * @param icon - Lucide React 아이콘
 * @param change - 증감률 (양수: 증가, 음수: 감소)
 * @param unit - 값의 단위
 */
export function StatCard({ title, value, icon: Icon, change, unit }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString()}
          {unit && <span className="text-muted-foreground text-base font-normal"> {unit}</span>}
        </div>
        {change !== undefined && (
          <p
            className={cn(
              "text-xs",
              change > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {change > 0 ? "+" : ""}
            {change}% 전월 대비
          </p>
        )}
      </CardContent>
    </Card>
  );
}
