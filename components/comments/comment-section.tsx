import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommentList } from "./comment-list";
import { CommentForm } from "./comment-form";
import type { CommentWithUser } from "@/lib/types/models";

/**
 * 댓글 섹션 Props
 */
interface CommentSectionProps {
  eventId: string;
  comments: CommentWithUser[];
  currentUserId: string;
  isAdmin: boolean;
}

/**
 * 댓글 섹션 컴포넌트
 *
 * 이벤트 상세 페이지에서 사용하는 댓글 전체 섹션입니다.
 * 댓글 작성 폼과 댓글 목록을 포함합니다.
 */
export function CommentSection({ eventId, comments, currentUserId, isAdmin }: CommentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          댓글 ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 댓글 작성 폼 */}
        <CommentForm eventId={eventId} />

        {/* 구분선 */}
        <div className="border-t" />

        {/* 댓글 목록 */}
        <CommentList
          comments={comments}
          eventId={eventId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      </CardContent>
    </Card>
  );
}
