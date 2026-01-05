import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Link as LinkIcon, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-10 text-center">
        {/* 헤더 */}
        <div className="space-y-3">
          <h1 className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
            Gather
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            초대 링크 하나로 모든 것을 해결하는
            <br />
            일회성 이벤트 관리 플랫폼
          </p>
        </div>

        {/* 주요 기능 3가지 */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-card text-card-foreground flex flex-col items-center space-y-2 rounded-xl border p-4">
            <Calendar className="text-primary h-8 w-8" />
            <h3 className="text-sm font-semibold">간편한 이벤트 생성</h3>
            <p className="text-muted-foreground text-xs leading-snug">
              제목, 날짜, 장소만 입력하면 즉시 이벤트 생성
            </p>
          </div>

          <div className="bg-card text-card-foreground flex flex-col items-center space-y-2 rounded-xl border p-4">
            <LinkIcon className="text-primary h-8 w-8" />
            <h3 className="text-sm font-semibold">원클릭 초대 시스템</h3>
            <p className="text-muted-foreground text-xs leading-snug">
              자동 생성된 초대 링크를 카카오톡으로 간편 공유
            </p>
          </div>

          <div className="bg-card text-card-foreground flex flex-col items-center space-y-2 rounded-xl border p-4">
            <Users className="text-primary h-8 w-8" />
            <h3 className="text-sm font-semibold">실시간 참여자 관리</h3>
            <p className="text-muted-foreground text-xs leading-snug">
              참여자 목록 자동 업데이트로 현황 파악
            </p>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="pt-4">
          <Link href="/auth/login" className="block">
            <Button size="lg" className="w-full rounded-xl py-6 text-base font-semibold shadow-lg">
              Google로 시작하기
            </Button>
          </Link>
        </div>

        {/* 부가 정보 */}
        <p className="text-muted-foreground pt-2 text-xs">
          5-30명 규모의 소규모 이벤트에 최적화된 플랫폼
        </p>
      </div>
    </main>
  );
}
