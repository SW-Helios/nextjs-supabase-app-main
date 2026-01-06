import { CommentItem } from "./comment-item";
import type { CommentWithUser } from "@/lib/types/models";

/**
 * 댓글 목록 Props
 */
interface CommentListProps {
  comments: CommentWithUser[];
  eventId: string;
  currentUserId: string;
  isAdmin: boolean;
}

/**
 * 댓글 목록 컴포넌트
 *
 * 댓글 목록을 렌더링합니다. 댓글이 없으면 안내 메시지를 표시합니다.
 */
export function CommentList({ comments, eventId, currentUserId, isAdmin }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground text-sm">아직 댓글이 없습니다.</p>
        <p className="text-muted-foreground mt-1 text-xs">첫 번째 댓글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          eventId={eventId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
