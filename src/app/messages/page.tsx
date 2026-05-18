import { redirect } from "next/navigation";
import { ConversationStartForm } from "@/components/ConversationStartForm";
import { MessagesClient } from "@/components/MessagesClient";
import { getCurrentUser } from "@/lib/auth";
import { getConversations } from "@/lib/messages";
import { getDiscoverUsers } from "@/lib/queries";

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

        <div className="mt-6">
          <MessagesClient initial={conversations} />
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
