import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ChatCenteredDots } from "@phosphor-icons/react/dist/ssr";
import { CommentForm } from "@/components/CommentForm";
import { CommentItem } from "@/components/CommentItem";
import { PostCard } from "@/components/PostCard";
import { getCurrentUser } from "@/lib/auth";
import { getPostDetail } from "@/lib/queries";

type PostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const postId = Number(id);

  if (!Number.isInteger(postId)) {
    notFound();
  }

  const detail = await getPostDetail(postId, user.id);

  if (!detail) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link
        href="/feed"
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-charcoal/10 px-4 text-sm font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal active:scale-[0.98]"
      >
        <ArrowLeft size={17} weight="bold" />
        Torna al feed
      </Link>

      <section className="mt-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-fern-900">
              Conversazione
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-charcoal">
              Post e risposte
            </h1>
          </div>
          <div className="hidden items-center gap-2 rounded-lg bg-fern-100 px-3 py-2 font-mono text-xs font-semibold text-fern-900 sm:inline-flex">
            <ChatCenteredDots size={16} weight="bold" />
            {detail.comments.length}
          </div>
        </div>

        <div className="rounded-lg border border-charcoal/10 bg-surface p-3 sm:p-5">
          <PostCard post={detail.post} currentUserId={user.id} />
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        <CommentForm postId={postId} />

        {detail.comments.length ? (
          <div className="grid gap-3">
            {detail.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={user.id}
                currentUserRole={user.role}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-charcoal/16 bg-paper px-4 py-10">
            <h2 className="text-xl font-semibold tracking-tight text-charcoal">
              Nessuna risposta, per ora.
            </h2>
            <p className="mt-2 max-w-[56ch] leading-7 text-charcoal/58">
              Apri la conversazione con un commento breve: il post avrà subito più contesto.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
