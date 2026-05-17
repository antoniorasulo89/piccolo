import Link from "next/link";
import type { CommentWithAuthor } from "@/lib/queries";
import { DeleteCommentButton } from "./DeleteCommentButton";
import { EditCommentButton } from "./EditCommentButton";
import { ProfileBadges } from "./ProfileBadges";
import { UserAvatar } from "./UserAvatar";

type CommentItemProps = {
  comment: CommentWithAuthor;
  currentUserId: number;
  currentUserRole?: "admin" | "user";
};

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(Math.floor(diff / 60000), 0);

  if (minutes < 1) return "ora";
  if (minutes < 60) return `${minutes} min fa`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h fa`;

  const days = Math.floor(hours / 24);
  return `${days} g fa`;
}

export function CommentItem({
  comment,
  currentUserId,
  currentUserRole = "user",
}: CommentItemProps) {
  const canDelete = comment.user.id === currentUserId || currentUserRole === "admin";

  return (
    <article className="rounded-lg border border-charcoal/10 bg-paper p-4 transition duration-300 hover:border-charcoal/18 hover:bg-surface">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${comment.user.id}`}>
          <UserAvatar user={comment.user} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Link
                  href={`/profile/${comment.user.id}`}
                  className="font-semibold text-charcoal transition hover:text-fern-900"
                >
                  {comment.user.name}
                </Link>
                <span className="font-mono text-xs text-charcoal/38">{relativeTime(comment.created_at)}</span>
              </div>
              <div className="mt-1">
                <ProfileBadges role={comment.user.role ?? "user"} />
              </div>
            </div>
            {canDelete ? (
              <div className="flex items-center gap-1">
                {comment.user.id === currentUserId ? (
                  <EditCommentButton
                    commentId={comment.id}
                    initialContent={comment.content}
                  />
                ) : null}
                <DeleteCommentButton commentId={comment.id} />
              </div>
            ) : null}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[0.95rem] leading-7 text-charcoal/78">
            {comment.content}
          </p>
          {comment.edited_at ? (
            <p className="mt-1 font-mono text-xs text-charcoal/35">Modificato</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
