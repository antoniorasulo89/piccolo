import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConversationManagePanel } from "@/components/ConversationManagePanel";
import { MessageComposer } from "@/components/MessageComposer";
import { MessageList } from "@/components/MessageList";
import { RefreshCountsOnMount } from "@/components/RefreshCountsOnMount";
import { UserAvatar } from "@/components/UserAvatar";
import { getCurrentUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { getConversationDetail } from "@/lib/messages";

type MessagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function MessagePage({ params }: MessagePageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) notFound();

  const detail = await getConversationDetail(conversationId, user.id);
  if (!detail) notFound();

  const title =
    detail.conversation.title ||
    detail.members
      .filter((member) => member.id !== user.id)
      .map((member) => member.name)
      .join(", ") ||
    "Conversazione";

  const archivedRow = await queryOne<{ archived_at: string | null }>(
    "SELECT archived_at FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
    [conversationId, user.id],
  );
  const isArchived = Boolean(archivedRow?.archived_at);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <RefreshCountsOnMount />
      <section className="rounded-lg border border-charcoal/10 bg-linear-to-br from-surface via-surface to-clay-100/28 p-5 shadow-[0_24px_80px_-58px_oklch(22%_0.018_160)]">
        <Link href="/messages" className="text-sm font-semibold text-fern-900 underline-offset-4 hover:underline">
          Torna ai messaggi
        </Link>
        <div className="mt-4 flex flex-col gap-4 border-b border-charcoal/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
              {detail.conversation.type === "group_dm" ? "DM gruppo" : "DM"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-charcoal">
              {title}
            </h1>
            <p className="mt-2 text-sm text-charcoal/55">
              {detail.members.length} partecipanti
            </p>
          </div>
          <div className="flex -space-x-2">
            {detail.members.slice(0, 5).map((member) => (
              <UserAvatar key={member.id} user={member} size="sm" />
            ))}
          </div>
        </div>

        <div className="mt-5">
          <MessageList
            initial={detail.messages}
            conversationId={conversationId}
            currentUserId={user.id}
          />
        </div>

        <div className="mt-6 border-t border-charcoal/10 pt-4">
          <MessageComposer conversationId={conversationId} />
        </div>

        <ConversationManagePanel
          conversationId={conversationId}
          type={detail.conversation.type}
          title={title}
          members={detail.members}
          isArchived={isArchived}
          canManage={detail.viewerRole === "owner" || user.role === "admin"}
        />
      </section>
    </main>
  );
}
