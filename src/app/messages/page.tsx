import Link from "next/link";
import { ChatCircleText, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { ConversationStartForm } from "@/components/ConversationStartForm";
import { getCurrentUser } from "@/lib/auth";
import { getConversations } from "@/lib/messages";
import { getDiscoverUsers } from "@/lib/queries";

function formatDate(value: string | null) {
  if (!value) return "nessun messaggio";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [conversations, users] = await Promise.all([
    getConversations(user.id),
    getDiscoverUsers(user.id),
  ]);

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
      <section>
        <div className="border-b border-charcoal/10 pb-7">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
            Messaggi
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-charcoal">
            DM e chat di gruppo.
          </h1>
          <p className="mt-4 max-w-[62ch] leading-7 text-charcoal/60">
            Conversazioni private tra profili, oppure stanze piccole con piu persone.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          {conversations.length ? (
            conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className={`group relative overflow-hidden rounded-lg border border-charcoal/10 p-4 shadow-[0_20px_60px_-52px_oklch(22%_0.018_160)] transition hover:-translate-y-0.5 hover:border-clay/55 ${
                  conversation.unread_count > 0
                    ? "bg-linear-to-br from-fern-100/45 via-surface to-surface"
                    : "bg-linear-to-br from-surface via-surface to-clay-100/24"
                }`}
              >
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${conversation.unread_count > 0 ? "bg-fern-700" : "bg-clay"}`} />
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-charcoal text-paper">
                    {conversation.type === "group_dm" ? <UsersThree size={19} weight="bold" /> : <ChatCircleText size={19} weight="bold" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`font-semibold text-charcoal ${conversation.unread_count > 0 ? "" : ""}`}>
                        {conversation.title || conversation.members_label || "Conversazione"}
                      </h2>
                      {conversation.unread_count > 0 ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 font-mono text-xs font-semibold text-rose-900">
                          {conversation.unread_count} nuovo{conversation.unread_count !== 1 ? "i" : ""}
                        </span>
                      ) : null}
                    </div>
                    <p className={`mt-1 line-clamp-1 text-sm ${conversation.unread_count > 0 ? "font-medium text-charcoal" : "text-charcoal/58"}`}>
                      {conversation.last_message || "Nessun messaggio ancora."}
                    </p>
                    <p className="mt-2 font-mono text-xs text-charcoal/42">
                      {conversation.type === "group_dm" ? "DM gruppo" : "DM"} / {formatDate(conversation.last_message_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-charcoal/10 bg-surface p-8">
              <h2 className="text-xl font-semibold tracking-tight text-charcoal">
                Nessuna conversazione.
              </h2>
              <p className="mt-2 max-w-[52ch] leading-7 text-charcoal/58">
                Apri un DM con un profilo o crea una chat privata con piu persone.
              </p>
            </div>
          )}
        </div>
      </section>

      <aside className="lg:pt-24">
        <div className="sticky top-24">
          <ConversationStartForm users={users.map(({ id, name }) => ({ id, name }))} />
        </div>
      </aside>
    </main>
  );
}
