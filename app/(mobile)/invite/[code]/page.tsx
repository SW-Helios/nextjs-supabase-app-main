import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Users, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEventByInviteCode } from "@/lib/queries/events";
import { formatDate } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JoinButton } from "@/components/events/join-button";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ code: string }>;
}

/**
 * 동적 메타데이터 생성 (카카오톡/SNS 미리보기용)
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;

  if (!code || code.trim() === "") {
    return {
      title: "잘못된 초대 링크",
    };
  }

  const event = await getEventByInviteCode(code);

  if (!event) {
    return {
      title: "이벤트를 찾을 수 없습니다",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nextjs-supabase-app-main.vercel.app";

  return {
    title: `${event.title} - 이벤트 초대`,
    description: event.description || `${event.host.username}님이 초대했습니다. ${event.location}에서 만나요!`,
    openGraph: {
      title: event.title,
      description: event.description || `${event.host.username}님이 초대했습니다`,
      type: "website",
      url: `${baseUrl}/invite/${code}`,
      images: event.cover_image_url
        ? [
            {
              url: event.cover_image_url,
              width: 1200,
              height: 630,
              alt: event.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.description || `${event.host.username}님이 초대했습니다`,
      images: event.cover_image_url ? [event.cover_image_url] : undefined,
    },
  };
}

/**
 * 초대 링크 참여 페이지
 *
 * 초대 코드를 통해 이벤트에 참여할 수 있는 페이지입니다.
 * 이벤트 미리보기와 참여 버튼을 제공합니다.
 */
export default async function InvitePage({ params }: PageProps) {
  const { code } = await params;

  // 빈 코드 처리
  if (!code || code.trim() === "") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <EmptyState
          icon={AlertCircle}
          title="잘못된 초대 링크입니다"
          description="올바른 초대 링크를 사용해주세요."
        />
      </div>
    );
  }

  // 인증 확인 (비로그인도 허용)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 초대 코드로 이벤트 조회 (비로그인 시 userId 없이 조회)
  const event = await getEventByInviteCode(code, user?.id);

  // 이벤트가 없는 경우
  if (!event) {
    notFound();
  }

  return (
    <div className="container max-w-2xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">이벤트 초대</h1>
        <p className="text-muted-foreground">{event.host.username}님이 초대했습니다</p>
      </div>

      {/* 이벤트 미리보기 카드 */}
      <Card className="overflow-hidden">
        {/* 커버 이미지 */}
        {event.cover_image_url && (
          <div className="bg-muted relative h-48 w-full">
            <Image
              src={event.cover_image_url}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <CardHeader>
          <h2 className="text-xl font-semibold">{event.title}</h2>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 설명 */}
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>

          {/* 이벤트 정보 */}
          <div className="space-y-3 pt-2">
            {/* 날짜 */}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
              <span>{formatDate(event.event_date)}</span>
            </div>

            {/* 장소 */}
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
              <span>{event.location}</span>
            </div>

            {/* 참여자 수 */}
            <div className="flex items-center gap-3 text-sm">
              <Users className="text-muted-foreground h-4 w-4 shrink-0" />
              <span>참여자 {event.participant_count}명</span>
            </div>
          </div>

          {/* 호스트 정보 */}
          <div className="flex items-center gap-3 border-t pt-4">
            <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
              {event.host.avatar_url ? (
                <Image
                  src={event.host.avatar_url}
                  alt={event.host.username ?? ""}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center text-sm font-semibold">
                  {event.host.username?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{event.host.username}</p>
              <p className="text-muted-foreground text-xs">호스트</p>
            </div>
          </div>

          {/* 조건부 참여 버튼 */}
          <div className="pt-4">
            {!user ? (
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link href={`/events/${event.id}`}>자세히 보기</Link>
                </Button>
                <p className="text-muted-foreground text-center text-sm">
                  참여하려면{" "}
                  <Link href={`/auth/login?redirect=/invite/${code}`} className="text-primary underline">
                    로그인
                  </Link>
                  이 필요합니다
                </p>
              </div>
            ) : event.isParticipating ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-center text-sm">
                  이미 참여한 이벤트입니다
                </p>
                <Button asChild className="w-full" size="lg">
                  <Link href={`/events/${event.id}`}>자세히 보기</Link>
                </Button>
              </div>
            ) : (
              <JoinButton inviteCode={code} eventTitle={event.title} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
