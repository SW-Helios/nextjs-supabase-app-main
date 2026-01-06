import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventEditForm } from "@/components/events/event-edit-form";
import { getEventDetail, isUserHost } from "@/lib/queries/events";
import { createClient } from "@/lib/supabase/server";

/**
 * 이벤트 수정 페이지 (Server Component)
 *
 * 기존 이벤트 데이터를 Supabase에서 조회하여 수정할 수 있는 폼을 제공합니다.
 * 호스트만 접근 가능합니다.
 */
export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15: params는 Promise 타입
  const { id } = await params;

  // 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 이벤트 데이터 조회 (참여자 목록 포함)
  const eventDetail = await getEventDetail(id);

  // 이벤트가 없으면 404 페이지로 처리
  if (!eventDetail) {
    notFound();
  }

  // 현재 사용자가 호스트인지 확인
  const isHost = await isUserHost(user.id, id);

  // 호스트가 아닌 경우 이벤트 상세 페이지로 리다이렉트
  if (!isHost) {
    redirect(`/events/${id}`);
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">이벤트 수정</h1>
          <p className="text-muted-foreground text-sm">이벤트 정보를 수정하세요</p>
        </div>
      </div>

      {/* 수정 폼 */}
      <EventEditForm event={eventDetail} />
    </div>
  );
}
