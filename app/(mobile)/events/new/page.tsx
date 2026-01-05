import { redirect } from "next/navigation";
import { getUserHostedEvents } from "@/lib/data";
import { EventForm } from "@/components/events/event-form";

/**
 * 이벤트 생성 페이지 (Server Component)
 *
 * 호스팅 이벤트가 있는 사용자만 접근 가능합니다.
 * 권한이 없는 사용자는 이벤트 목록 페이지로 리다이렉트됩니다.
 */
export default async function NewEventPage() {
  // 현재 사용자 ID (Phase 2: 하드코딩)
  const currentUserId = "user-001";

  // 권한 체크: 호스팅 이벤트가 없으면 접근 불가
  const hostedEvents = getUserHostedEvents(currentUserId);
  if (hostedEvents.length === 0) {
    redirect("/events");
  }

  return <EventForm />;
}
