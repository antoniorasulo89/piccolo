import Link from "next/link";
import { ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import { relativeTimeFromNow } from "@/lib/dates";
import type { PostWithAuthor } from "@/lib/db";
import { BookmarkButton } from "./BookmarkButton";
import { DeletePostButton } from "./DeletePostButton";
import { EditPostButton } from "./EditPostButton";
import { LikeButton } from "./LikeButton";
import { ProfileBadges } from "./ProfileBadges";
import { ReportPostButton } from "./ReportPostButton";
import { UserAvatar } from "./UserAvatar";

type PostCardProps = {
  post: PostWithAuthor & { group_name?: string | null; group_slug?: string | null };
  currentUserId: number;
  staggerIndex?: number;
};

export function PostCard({ post, currentUserId, staggerIndex = 0 }: PostCardProps) {
  return (
    <article
      className="group relative overflow-hidden rounded-lg border border-transparent bg-linear-to-br from-surface via-surface to-clay-100/24 px-3 py-5 transition duration-300 animate-stagger-fade hover:-translate-y-0.5 hover:border-charcoal/10 hover:bg-paper/72 hover:shadow-[0_24px_70px_-54px_oklch(22%_0.018_160)]"
      style={{ animationDelay: `${Math.min(staggerIndex * 50, 300)}ms` }}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-3 top-0 h-0.5 rounded-full ${
          post.i_bookmarked ? "bg-clay" : post.i_liked ? "bg-rose-900/45" : "bg-fern-700/45"
        }`}
      />
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.user.id}`}>
          <UserAvatar user={post.user} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/profile/${post.user.id}`}
                className="font-semibold text-charcoal transition hover:text-fern-900"
              >
                {post.user.name}
              </Link>
              <p className="font-mono text-xs text-charcoal/45">{relativeTimeFromNow(post.created_at)}</p>
              {"group_name" in post && post.group_name ? (
                <Link
                  href={`/groups/${post.group_slug}`}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-fern-900/70 hover:text-fern-900 hover:underline"
                >
                  nel gruppo {post.group_name}
                </Link>
              ) : null}
              <div className="mt-1">
                <ProfileBadges
                  role={post.user.role ?? "user"}
                />
              </div>
            </div>

            {post.user.id === currentUserId ? (
              <DeletePostButton postId={post.id} />
            ) : (
              <ReportPostButton postId={post.id} />
            )}
          </div>

          <Link
            href={`/post/${post.id}`}
            className="mt-3 block whitespace-pre-wrap text-[0.98rem] leading-7 text-charcoal/82 transition hover:text-charcoal"
          >
            {post.content}
          </Link>
          {post.edited_at ? (
            <p className="mt-1 font-mono text-xs text-charcoal/35">Modificato</p>
          ) : null}
          {post.user.id === currentUserId ? (
            <EditPostButton postId={post.id} initialContent={post.content} />
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-charcoal/[0.06] pt-3">
            <LikeButton
              postId={post.id}
              initialLiked={post.i_liked}
              initialCount={post.likes_count}
            />
            <Link
              href={`/post/${post.id}`}
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-charcoal/60 transition duration-300 hover:bg-fern-100 hover:text-fern-900 active:scale-[0.96]"
            >
              <ChatCircleText size={18} />
              <span>{post.comments_count}</span>
            </Link>
            <BookmarkButton
              postId={post.id}
              initialBookmarked={post.i_bookmarked}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
