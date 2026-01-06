import { ImageResponse } from "next/og";
import { getEventByInviteCode } from "@/lib/queries/events";

// 이미지 설정
export const runtime = "edge";
export const alt = "이벤트 초대";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * 동적 OG 이미지 생성
 *
 * 초대 링크 공유 시 이벤트 커버 이미지를 OG 이미지로 표시합니다.
 */
export default async function Image({ params }: { params: { code: string } }) {
  const { code } = params;

  // 이벤트 조회
  const event = await getEventByInviteCode(code);

  // 이벤트가 없거나 커버 이미지가 없는 경우 기본 이미지
  if (!event) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          이벤트를 찾을 수 없습니다
        </div>
      ),
      { ...size }
    );
  }

  // 커버 이미지가 있으면 해당 이미지 사용
  if (event.cover_image_url) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
          }}
        >
          {/* 커버 이미지 배경 */}
          <img
            src={event.cover_image_url}
            alt={event.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* 오버레이 그라데이션 */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "50%",
              background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "40px",
            }}
          >
            <div style={{ color: "white", fontSize: 48, fontWeight: "bold" }}>
              {event.title}
            </div>
            <div style={{ color: "#ccc", fontSize: 24, marginTop: 10 }}>
              {event.host.username}님이 초대했습니다
            </div>
          </div>
        </div>
      ),
      { ...size }
    );
  }

  // 커버 이미지가 없는 경우 텍스트 기반 이미지 생성
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: "40px",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: "bold", marginBottom: 20 }}>
          {event.title}
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          {event.host.username}님이 초대했습니다
        </div>
        <div style={{ fontSize: 24, opacity: 0.7, marginTop: 30 }}>
          {event.location}
        </div>
      </div>
    ),
    { ...size }
  );
}
