/**
 * 이벤트 관련 Server Actions
 *
 * Next.js 15.5.3 Server Actions 패턴을 사용한 이벤트 CRUD 작업입니다.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { eventFormSchema } from "@/lib/schemas/event";
import { generateUniqueInviteCode } from "@/lib/utils/invite-code";
import { getParticipantById } from "@/lib/constants/participants";
import type { ActionResult } from "@/lib/types/forms";

/**
 * 이벤트 생성 Server Action
 *
 * 새로운 이벤트를 생성하고 주최자를 자동으로 참여자로 추가합니다.
 *
 * @param prevState - 이전 상태 (useActionState에서 사용)
 * @param formData - 폼 데이터 (title, description, location, event_date, cover_image_url)
 * @returns Promise<ActionResult<{ id: string; invite_code: string }>> - 생성된 이벤트 정보
 *
 * @example
 * ```typescript
 * const [state, formAction] = useActionState(createEventAction, {
 *   success: false,
 *   message: ''
 * });
 *
 * <form action={formAction}>
 *   <input name="title" />
 *   <input name="location" />
 *   <input name="event_date" type="datetime-local" />
 *   <button type="submit">생성</button>
 * </form>
 * ```
 */
export async function createEventAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult<{ id: string; invite_code: string }>> {
  try {
    // A. Supabase 클라이언트 생성 (함수 내부에서 매번 새로 생성)
    const supabase = await createClient();

    // B. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("인증 상태 확인:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error("인증 실패:", authError);
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // C. 서버 사이드 스키마 검증 (이중 검증)
    const participantIdsRaw = formData.get("participant_ids");
    const participantIds = participantIdsRaw ? JSON.parse(participantIdsRaw as string) : [];

    // 좌표 파싱
    const latitudeRaw = formData.get("latitude") as string;
    const longitudeRaw = formData.get("longitude") as string;
    const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null;
    const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null;

    const validatedFields = eventFormSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || "",
      location: formData.get("location"),
      latitude: latitude && !isNaN(latitude) ? latitude : null,
      longitude: longitude && !isNaN(longitude) ? longitude : null,
      event_date: formData.get("event_date"),
      cover_image_url: formData.get("cover_image_url") || "",
      participant_ids: participantIds,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "입력된 정보를 확인해주세요.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // D. 초대 코드 생성 (중복 체크 포함)
    const invite_code = await generateUniqueInviteCode(supabase);

    // E. 이벤트 생성 (participant_ids는 events 테이블에 저장하지 않음)
    const { participant_ids, latitude: lat, longitude: lng, ...eventData } = validatedFields.data;

    console.log("이벤트 생성 시도:", {
      user_id: user.id,
      invite_code,
      validated_data: eventData,
      latitude: lat,
      longitude: lng,
      participant_ids: participant_ids, // 디버깅: 선택된 참여자 ID 확인
    });

    const { data: event, error: insertError } = await supabase
      .from("events")
      .insert({
        ...eventData,
        latitude: lat,
        longitude: lng,
        invite_code,
        created_by: user.id,
        status: "active",
      })
      .select()
      .single();

    if (insertError || !event) {
      console.error("이벤트 생성 실패:", {
        error: insertError,
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
      });
      return {
        success: false,
        message: `이벤트 생성에 실패했습니다: ${insertError?.message || "알 수 없는 오류"}`,
      };
    }

    // F. 호스트는 DB 트리거(handle_new_event)가 자동으로 추가하므로 별도 처리 불필요

    // G. 선택된 고정 참여자들을 event_participants에 추가
    console.log("참여자 추가 시작:", {
      participant_ids,
      event_id: event.id,
    });

    if (participant_ids.length > 0) {
      const fixedParticipants = participant_ids
        .map((id) => {
          const participant = getParticipantById(id);
          if (!participant) {
            console.warn("참여자 ID를 찾을 수 없음:", id);
            return null;
          }
          return {
            event_id: event.id,
            participant_name: participant.name,
            role: "participant",
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      console.log("추가할 참여자 목록:", fixedParticipants);

      if (fixedParticipants.length > 0) {
        const { data: insertedParticipants, error: fixedParticipantsError } = await supabase
          .from("event_participants")
          .insert(fixedParticipants)
          .select();

        if (fixedParticipantsError) {
          console.error("고정 참여자 추가 실패:", {
            error: fixedParticipantsError,
            code: fixedParticipantsError.code,
            message: fixedParticipantsError.message,
            details: fixedParticipantsError.details,
          });
          // 경고만 표시하고 계속 진행
        } else {
          console.log("고정 참여자 추가 성공:", insertedParticipants);
        }
      }
    } else {
      console.log("선택된 참여자 없음 - 참여자 추가 건너뜀");
    }

    // H. 캐시 무효화
    revalidatePath("/events");

    return {
      success: true,
      message: "이벤트가 성공적으로 생성되었습니다.",
      data: {
        id: event.id,
        invite_code: event.invite_code,
      },
    };
  } catch (error) {
    console.error("이벤트 생성 중 예외 발생:", error);
    return {
      success: false,
      message: "이벤트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}

/**
 * 이벤트 수정 Server Action
 *
 * 기존 이벤트의 정보를 수정합니다. 주최자만 수정할 수 있습니다.
 *
 * @param eventId - 수정할 이벤트 ID
 * @param prevState - 이전 상태 (useActionState에서 사용)
 * @param formData - 수정할 폼 데이터
 * @returns Promise<ActionResult<{ id: string }>> - 수정된 이벤트 ID
 *
 * @example
 * ```typescript
 * const [state, formAction] = useActionState(
 *   updateEventAction.bind(null, eventId),
 *   { success: false, message: '' }
 * );
 *
 * <form action={formAction}>
 *   <input name="title" />
 *   <button type="submit">수정</button>
 * </form>
 * ```
 */
export async function updateEventAction(
  eventId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // A. Supabase 클라이언트 생성
    const supabase = await createClient();

    // B. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("인증 상태 확인:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error("인증 실패:", authError);
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // C. 서버 사이드 스키마 검증
    const participantIdsRaw = formData.get("participant_ids");
    const participantIds = participantIdsRaw ? JSON.parse(participantIdsRaw as string) : [];

    // 좌표 파싱
    const latitudeRaw = formData.get("latitude") as string;
    const longitudeRaw = formData.get("longitude") as string;
    const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null;
    const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null;

    const validatedFields = eventFormSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || "",
      location: formData.get("location"),
      latitude: latitude && !isNaN(latitude) ? latitude : null,
      longitude: longitude && !isNaN(longitude) ? longitude : null,
      event_date: formData.get("event_date"),
      cover_image_url: formData.get("cover_image_url") || "",
      participant_ids: participantIds,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "입력된 정보를 확인해주세요.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // D. 이벤트 존재 여부 및 소유권 확인
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("id, created_by")
      .eq("id", eventId)
      .single();

    if (fetchError || !existingEvent) {
      console.error("이벤트 조회 실패:", fetchError);
      return {
        success: false,
        message: "이벤트를 찾을 수 없습니다.",
      };
    }

    // E. 소유권 검증 (주최자만 수정 가능)
    if (existingEvent.created_by !== user.id) {
      console.error("권한 없음:", {
        eventCreatedBy: existingEvent.created_by,
        currentUserId: user.id,
      });
      return {
        success: false,
        message: "이벤트를 수정할 권한이 없습니다.",
      };
    }

    // F. 이벤트 업데이트 (participant_ids는 events 테이블에 저장하지 않음)
    const { participant_ids, latitude: lat, longitude: lng, ...eventData } = validatedFields.data;

    console.log("이벤트 수정 시도:", {
      eventId,
      userId: user.id,
      validatedData: eventData,
      latitude: lat,
      longitude: lng,
    });

    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update({
        ...eventData,
        latitude: lat,
        longitude: lng,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select()
      .single();

    if (updateError || !updatedEvent) {
      console.error("이벤트 수정 실패:", {
        error: updateError,
        code: updateError?.code,
        message: updateError?.message,
      });
      return {
        success: false,
        message: `이벤트 수정에 실패했습니다: ${updateError?.message || "알 수 없는 오류"}`,
      };
    }

    // G. 참여자 업데이트 (기존 고정 참여자 삭제 후 새 참여자 추가)
    // 호스트와 실제 사용자(user_id가 있는) 참여자는 유지
    console.log("참여자 업데이트 시작:", {
      eventId,
      participant_ids,
    });

    const { data: deletedParticipants, error: deleteParticipantsError } = await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .is("user_id", null) // user_id가 null인 고정 참여자만 삭제
      .neq("role", "host") // 호스트는 삭제하지 않음
      .select();

    if (deleteParticipantsError) {
      console.error("기존 참여자 삭제 실패:", {
        error: deleteParticipantsError,
        code: deleteParticipantsError.code,
        message: deleteParticipantsError.message,
      });
      // 계속 진행
    } else {
      console.log("기존 고정 참여자 삭제 완료:", deletedParticipants);
    }

    // 새 고정 참여자 추가
    if (participant_ids.length > 0) {
      const fixedParticipants = participant_ids
        .map((id) => {
          const participant = getParticipantById(id);
          if (!participant) {
            console.warn("참여자 ID를 찾을 수 없음:", id);
            return null;
          }
          return {
            event_id: eventId,
            participant_name: participant.name,
            role: "participant",
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      console.log("추가할 새 참여자 목록:", fixedParticipants);

      if (fixedParticipants.length > 0) {
        const { data: insertedParticipants, error: insertParticipantsError } = await supabase
          .from("event_participants")
          .insert(fixedParticipants)
          .select();

        if (insertParticipantsError) {
          console.error("새 참여자 추가 실패:", {
            error: insertParticipantsError,
            code: insertParticipantsError.code,
            message: insertParticipantsError.message,
            details: insertParticipantsError.details,
          });
          // 경고만 표시하고 계속 진행
        } else {
          console.log("새 참여자 추가 성공:", insertedParticipants);
        }
      }
    } else {
      console.log("선택된 참여자 없음 - 새 참여자 추가 건너뜀");
    }

    // H. 캐시 무효화
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);

    return {
      success: true,
      message: "이벤트가 성공적으로 수정되었습니다.",
      data: {
        id: updatedEvent.id,
      },
    };
  } catch (error) {
    console.error("이벤트 수정 중 예외 발생:", error);
    return {
      success: false,
      message: "이벤트 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}

/**
 * 초대 링크로 이벤트 참여 Server Action
 *
 * 초대 코드를 사용하여 이벤트에 참여합니다.
 * 중복 참여는 데이터베이스 제약 조건으로 방지됩니다.
 *
 * @param inviteCode - 이벤트 초대 코드
 * @returns Promise<ActionResult<{ eventId: string }>> - 참여 결과 및 이벤트 ID
 *
 * @example
 * ```typescript
 * const result = await joinEventByInviteCodeAction(inviteCode);
 * if (result.success) {
 *   router.push(`/events/${result.data.eventId}`);
 * }
 * ```
 */
export async function joinEventByInviteCodeAction(
  inviteCode: string
): Promise<ActionResult<{ eventId: string }>> {
  try {
    // A. Supabase 클라이언트 생성 (함수 내부에서 매번 새로 생성)
    const supabase = await createClient();

    // B. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("인증 상태 확인:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error("인증 실패:", authError);
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // C. 초대 코드로 이벤트 조회
    console.log("초대 코드로 이벤트 조회:", { inviteCode });

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title")
      .eq("invite_code", inviteCode)
      .single();

    if (eventError || !event) {
      console.error("이벤트 조회 실패:", {
        error: eventError,
        code: eventError?.code,
        message: eventError?.message,
      });
      return {
        success: false,
        message: "존재하지 않는 초대 코드입니다.",
      };
    }

    // D. 중복 참여 체크 (애플리케이션 레벨)
    const { data: existingParticipant, error: checkError } = await supabase
      .from("event_participants")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", event.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116: 결과 없음 (정상)
      console.error("중복 참여 체크 실패:", checkError);
    }

    if (existingParticipant) {
      console.log("이미 참여한 이벤트:", {
        userId: user.id,
        eventId: event.id,
      });
      return {
        success: false,
        message: "이미 참여한 이벤트입니다.",
      };
    }

    // E. 참여자 추가
    console.log("참여자 추가 시도:", {
      userId: user.id,
      eventId: event.id,
      eventTitle: event.title,
    });

    const { error: insertError } = await supabase.from("event_participants").insert({
      event_id: event.id,
      user_id: user.id,
      role: "participant",
    });

    if (insertError) {
      console.error("참여자 추가 실패:", {
        error: insertError,
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
      });

      // UNIQUE 제약 조건 위반 처리 (데이터베이스 레벨 중복 방지)
      if (insertError.code === "23505") {
        return {
          success: false,
          message: "이미 참여한 이벤트입니다.",
        };
      }

      return {
        success: false,
        message: `이벤트 참여에 실패했습니다: ${insertError.message || "알 수 없는 오류"}`,
      };
    }

    // F. 캐시 무효화
    revalidatePath("/events");
    revalidatePath(`/events/${event.id}`);

    console.log("이벤트 참여 성공:", {
      userId: user.id,
      eventId: event.id,
    });

    return {
      success: true,
      message: "이벤트에 참여했습니다!",
      data: {
        eventId: event.id,
      },
    };
  } catch (error) {
    console.error("이벤트 참여 중 예외 발생:", error);
    return {
      success: false,
      message: "이벤트 참여 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}

/**
 * 이벤트 삭제 Server Action
 *
 * 기존 이벤트를 삭제합니다. 주최자만 삭제할 수 있습니다.
 * CASCADE 설정으로 연관된 참여자 정보도 자동으로 삭제됩니다.
 *
 * @param eventId - 삭제할 이벤트 ID
 * @returns Promise<ActionResult> - 삭제 결과
 *
 * @example
 * ```typescript
 * const result = await deleteEventAction(eventId);
 * if (result.success) {
 *   router.push('/events');
 * }
 * ```
 */
export async function deleteEventAction(eventId: string): Promise<ActionResult> {
  try {
    // A. Supabase 클라이언트 생성
    const supabase = await createClient();

    // B. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("인증 상태 확인:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error("인증 실패:", authError);
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // C. 이벤트 존재 여부 및 소유권 확인
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("id, created_by, title")
      .eq("id", eventId)
      .single();

    if (fetchError || !existingEvent) {
      console.error("이벤트 조회 실패:", fetchError);
      return {
        success: false,
        message: "이벤트를 찾을 수 없습니다.",
      };
    }

    // D. 소유권 검증 (주최자만 삭제 가능)
    if (existingEvent.created_by !== user.id) {
      console.error("권한 없음:", {
        eventCreatedBy: existingEvent.created_by,
        currentUserId: user.id,
      });
      return {
        success: false,
        message: "이벤트를 삭제할 권한이 없습니다.",
      };
    }

    // E. 이벤트 삭제 (CASCADE로 참여자도 자동 삭제)
    console.log("이벤트 삭제 시도:", {
      eventId,
      userId: user.id,
      eventTitle: existingEvent.title,
    });

    const { error: deleteError } = await supabase.from("events").delete().eq("id", eventId);

    if (deleteError) {
      console.error("이벤트 삭제 실패:", {
        error: deleteError,
        code: deleteError?.code,
        message: deleteError?.message,
      });
      return {
        success: false,
        message: `이벤트 삭제에 실패했습니다: ${deleteError?.message || "알 수 없는 오류"}`,
      };
    }

    // F. 캐시 무효화
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`); // 삭제된 이벤트 상세 페이지 캐시 무효화

    return {
      success: true,
      message: "이벤트가 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    console.error("이벤트 삭제 중 예외 발생:", error);
    return {
      success: false,
      message: "이벤트 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}
