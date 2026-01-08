"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { eventFormSchema, type EventFormData } from "@/lib/schemas/event";
import { showSuccess, showError } from "@/lib/utils/toast";
import { createEventAction } from "@/app/actions/events";
import { CoverImageUpload } from "@/components/events/cover-image-upload";
import { LocationPicker } from "@/components/maps/location-picker";
import { FIXED_PARTICIPANTS } from "@/lib/constants/participants";
import type { LocationData } from "@/lib/types/maps";

/**
 * 이벤트 생성 폼 (Client Component)
 *
 * React Hook Form + Zod 검증을 사용한 이벤트 폼입니다.
 */
export function EventForm() {
  const router = useRouter();

  // React Hook Form 초기화
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      latitude: null,
      longitude: null,
      event_date: "",
      cover_image_url: "",
      participant_ids: [],
    },
  });

  // 장소 선택 핸들러
  const handleLocationChange = (location: LocationData) => {
    form.setValue("location", location.address);
    form.setValue("latitude", location.latitude);
    form.setValue("longitude", location.longitude);
  };

  // 폼 제출 핸들러
  const onSubmit = async (data: EventFormData) => {
    try {
      // FormData 객체 생성
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("location", data.location);
      formData.append("latitude", data.latitude?.toString() || "");
      formData.append("longitude", data.longitude?.toString() || "");
      formData.append("event_date", data.event_date);
      // form.getValues()로 현재 값을 직접 가져옴 (setValue로 설정된 값 반영)
      formData.append("cover_image_url", form.getValues("cover_image_url") || "");
      formData.append("participant_ids", JSON.stringify(data.participant_ids));

      // Server Action 호출
      const result = await createEventAction({ success: false, message: "" }, formData);

      if (result.success) {
        showSuccess(result.message);
        router.push("/events");
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
      console.error("이벤트 생성 실패:", error);
      showError("이벤트 생성 중 오류가 발생했습니다.");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="space-y-6 pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">새 이벤트 만들기</h1>
          <p className="text-muted-foreground text-sm">
            새로운 이벤트를 만들고 사람들을 초대하세요
          </p>
        </div>
      </div>

      {/* 폼 */}
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

          {/* 참여자 선택 */}
          <FormField
            control={form.control}
            name="participant_ids"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>참여자 선택 *</FormLabel>
                  <FormDescription>이벤트에 참여할 사람을 선택하세요 (최소 1명)</FormDescription>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {FIXED_PARTICIPANTS.map((participant) => (
                    <FormField
                      key={participant.id}
                      control={form.control}
                      name="participant_ids"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={participant.id}
                            className="flex flex-row items-start space-y-0 space-x-3"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(participant.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, participant.id])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== participant.id)
                                      );
                                }}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer font-normal">
                              {participant.name}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 장소 (네이버 지도 연동) */}
          <FormField
            control={form.control}
            name="location"
            render={() => (
              <FormItem>
                <FormLabel>장소 *</FormLabel>
                <FormControl>
                  <LocationPicker
                    initialValue={{
                      address: form.getValues("location"),
                      latitude: form.getValues("latitude") ?? null,
                      longitude: form.getValues("longitude") ?? null,
                    }}
                    onChange={handleLocationChange}
                    disabled={isSubmitting}
                    mapHeight="h-40"
                  />
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
                    <CoverImageUpload form={form} disabled={isSubmitting} />
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
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                "이벤트 만들기"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
