import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getEventByInviteCode } from "@/lib/queries/events";

// Node.js runtime 사용 (Edge runtime 호환성 문제 해결)
export const runtime = "nodejs";

// 1시간 캐시
export const revalidate = 3600;

/**
 * 초대 링크용 동적 OG 이미지 생성 API
 *
 * 카카오톡/SNS 공유 시 이벤트 정보를 포함한 미리보기 이미지를 생성합니다.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code || code.trim() === "") {
      return new Response("Invalid invite code", { status: 400 });
    }

    // 이벤트 정보 조회
    const event = await getEventByInviteCode(code);

    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    // OG 이미지 생성 (1200x630 권장 크기)
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
            position: "relative",
          }}
        >
          {/* 배경 그라데이션 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              opacity: 0.1,
            }}
          />

          {/* 커버 이미지 영역 */}
          {event.cover_image_url ? (
            <div
              style={{
                width: "100%",
                height: "320px",
                display: "flex",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.cover_image_url}
                alt={event.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "320px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <span
                style={{
                  fontSize: "120px",
                }}
              >
                🎉
              </span>
            </div>
          )}

          {/* 컨텐츠 영역 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "32px 48px",
              flex: 1,
            }}
          >
            {/* 이벤트 제목 */}
            <div
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "#1a1a1a",
                marginBottom: "16px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {event.title}
            </div>

            {/* 이벤트 정보 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                fontSize: "24px",
                color: "#666666",
              }}
            >
              {/* 날짜 */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📅</span>
                <span>
                  {new Date(event.event_date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              {/* 장소 */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📍</span>
                <span>{event.location}</span>
              </div>
            </div>

            {/* 하단 정보 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "auto",
                paddingTop: "24px",
              }}
            >
              {/* 호스트 정보 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "20px",
                  color: "#888888",
                }}
              >
                <span>주최:</span>
                <span style={{ fontWeight: "600", color: "#1a1a1a" }}>{event.host.username}</span>
              </div>

              {/* 브랜드 */}
              <div
                style={{
                  fontSize: "18px",
                  color: "#888888",
                }}
              >
                쏘니의 모오임
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
