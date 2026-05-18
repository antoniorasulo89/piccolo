import Link from "next/link";
import { redirect } from "next/navigation";
import { MarkNotificationsReadButton } from "@/components/MarkNotificationsReadButton";
import { MarkNotificationsSeenOnMount } from "@/components/MarkNotificationsSeenOnMount";
import { NotificationList } from "@/components/NotificationList";
import { NotificationPreferencesForm } from "@/components/NotificationPreferencesForm";
import { PaginationLinks } from "@/components/PaginationLinks";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";
import { hasNextPage, pageItems, parsePage } from "@/lib/pagination";

type NotificationsPageProps = {
  searchParams: Promise<{ page?: string; unread?: string }>;
};

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = parsePage(params.page);
  const unreadOnly = params.unread === "1";
  const notifications = await getNotifications(user.id, page, unreadOnly);
  const visibleNotifications = pageItems(notifications);
  const unread = visibleNotifications.filter((item) => !item.read_at).length;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <MarkNotificationsSeenOnMount />
      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
            Notifiche
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-charcoal">
            Attivita recente
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={unreadOnly ? "/notifications" : "/notifications?unread=1"}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition active:scale-[0.98] ${
              unreadOnly
                ? "border-fern-700 bg-fern-100 text-fern-900"
                : "border-charcoal/10 text-charcoal/70 hover:border-charcoal/25 hover:text-charcoal"
            }`}
          >
            Non lette
          </Link>
          <MarkNotificationsReadButton disabled={unread === 0} />
        </div>
      </section>

      <div className="mb-4">
        <NotificationPreferencesForm
          initial={{
            notify_likes: Boolean(user.notify_likes),
            notify_comments: Boolean(user.notify_comments),
            notify_follows: Boolean(user.notify_follows),
            notify_group_posts: Boolean(user.notify_group_posts),
          }}
        />
      </div>

      <NotificationList initial={visibleNotifications} />
      <PaginationLinks
        page={page}
        hasNext={hasNextPage(notifications)}
        basePath="/notifications"
      />
    </main>
  );
}
