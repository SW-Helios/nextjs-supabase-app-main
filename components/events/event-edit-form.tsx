"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { eventFormSchema, type EventFormData } from "@/lib/schemas/event";
import { showSuccess, showError } from "@/lib/utils/toast";
import { updateEventAction } from "@/app/actions/events";
import { Loader2 } from "lucide-react";
import type { Event } from "@/lib/types/models";
import { CoverImageUpload } from "@/components/events/cover-image-upload";

interface EventEditFormProps {
  event: Event;
}

/**
 * 이벤트 수정 폼 (Client Component)
 *
 * 기존 이벤트 데이터를 폼에 표시하고 수정할 수 있습니다.
 */
export function EventEditForm({ event }: EventEditFormProps) {
  const router = useRouter();

  // React Hook Form 초기화
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event.title,
      description: event.description || "",
      location: event.location,
      // ISO 문자열을 datetime-local 형식으로 변환
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      cover_image_url: event.cover_image_url || "",
    },
  });

  // 폼 제출 핸들러
  const onSubmit = async (data: EventFormData) => {
    try {
      // FormData 객체 생성
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("location", data.location);
      formData.append("event_date", data.event_date);
      formData.append("cover_image_url", data.cover_image_url || "");

      // Server Action 호출
      const result = await updateEventAction(event.id, { success: false, message: "" }, formData);

      if (result.success) {
        showSuccess(result.message);
        router.push(`/events/${event.id}`);
        router.refresh();
      } else {
        showError(result.message);
        // 필드별 에러가 있다면 react-hook-form에 설정
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              form.setError(field as keyof EventFormData, {
                type: "manual",
                message: messages[0],
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("이벤트 수정 실패:", error);
      showError("이벤트 수정 중 오류가 발생했습니다.");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 제목 */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이벤트 제목 *</FormLabel>
              <FormControl>
                <Input placeholder="예: 개발자 모임" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 설명 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="이벤트에 대한 설명을 입력하세요"
                  className="min-h-[120px] resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 장소 */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>장소 *</FormLabel>
              <FormControl>
                <Input placeholder="예: 강남역 스타벅스" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 날짜 및 시간 */}
        <FormField
          control={form.control}
          name="event_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>날짜 및 시간 *</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 커버 이미지 업로드 */}
        <FormField
          control={form.control}
          name="cover_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>커버 이미지 (선택)</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <CoverImageUpload
                    form={form}
                    disabled={isSubmitting}
                    initialImageUrl={event.cover_image_url || undefined}
                  />
                  {/* 숨겨진 URL 필드 (폼 검증용) */}
                  <input type="hidden" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 제출 버튼 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/events/${event.id}`)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                수정 중...
              </>
            ) : (
              "수정 완료"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
