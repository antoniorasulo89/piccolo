import Link from "next/link";
import { AdminDeletePostButton } from "@/components/AdminDeletePostButton";
import { DeleteCommentButton } from "@/components/DeleteCommentButton";
import { PaginationLinks } from "@/components/PaginationLinks";
import { getAdminComments, getAdminPosts } from "@/lib/admin";
import { hasNextPage, pageItems } from "@/lib/pagination";
import { formatDate } from "./AdminStats";

type AdminContentProps = {
  comments: Awaited<ReturnType<typeof getAdminComments>>;
  posts: Awaited<ReturnType<typeof getAdminPosts>>;
  commentsPage: number;
  postsPage: number;
  paginationParams: Record<string, number>;
};

export function AdminContent({ comments, posts, commentsPage, postsPage, paginationParams }: AdminContentProps) {
  const visibleComments = pageItems(comments);
  const visiblePosts = pageItems(posts);

  return (
    <>
      <section id="contenuti" className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight text-charcoal">Moderazione commenti</h2>
        <p className="mt-1 text-sm text-charcoal/50">Ultime risposte pubblicate, con rimozione rapida se serve.</p>

        <div className="mt-4 overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
          {visibleComments.length ? (
            visibleComments.map((comment) => (
              <article key={comment.id} className="grid gap-4 border-b border-charcoal/10 p-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Link href={`/profile/${comment.author_id}`} className="font-semibold text-charcoal underline-offset-4 hover:underline">
                      {comment.author_name}
                    </Link>
                    <span className="text-xs text-charcoal/42">
                      su post di {comment.post_author_name} / {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <Link href={`/post/${comment.post_id}`} className="mt-2 inline-flex text-xs font-semibold text-fern-900 underline-offset-4 hover:underline">
                    Apri conversazione
                  </Link>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-charcoal/72">{comment.content}</p>
                  <p className="mt-2 break-all text-xs text-charcoal/42">{comment.author_email}</p>
                </div>
                <DeleteCommentButton commentId={comment.id} label="Rimuovi" />
              </article>
            ))
          ) : (
            <div className="p-8">
              <h3 className="font-semibold text-charcoal">Nessun commento da moderare.</h3>
              <p className="mt-1 text-sm text-charcoal/55">Le risposte della community appariranno qui.</p>
            </div>
          )}
        </div>
        <PaginationLinks page={commentsPage} hasNext={hasNextPage(comments)} basePath="/admin" pageParam="commentsPage" params={paginationParams} />
      </section>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight text-charcoal">Moderazione post</h2>
        <p className="mt-1 text-sm text-charcoal/50">Ultimi contenuti pubblicati, ordinati dal piu recente.</p>

        <div className="mt-4 rounded-lg border border-charcoal/10 bg-surface">
          {visiblePosts.length ? (
            visiblePosts.map((post) => (
              <article key={post.id} className="grid gap-4 border-b border-charcoal/10 p-4 last:border-b-0">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/profile/${post.author_id}`} className="font-semibold text-charcoal underline-offset-4 hover:underline">
                        {post.author_name}
                      </Link>
                      <p className="mt-1 text-xs text-charcoal/45">
                        {post.author_email} / {formatDate(post.created_at)}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-charcoal/40">{post.likes_count} like</p>
                  </div>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-charcoal/72">{post.content}</p>
                </div>
                <AdminDeletePostButton postId={post.id} />
              </article>
            ))
          ) : (
            <div className="p-8">
              <h3 className="font-semibold text-charcoal">Nessun post da moderare.</h3>
              <p className="mt-1 text-sm text-charcoal/55">Quando la community pubblichera contenuti, appariranno qui.</p>
            </div>
          )}
        </div>
        <PaginationLinks page={postsPage} hasNext={hasNextPage(posts)} basePath="/admin" pageParam="postsPage" params={paginationParams} />
      </div>
    </>
  );
}
