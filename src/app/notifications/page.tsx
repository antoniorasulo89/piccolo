import Link from "next/link";
import { redirect } from "next/navigation";
import { ChatCircleText, Heart, UserPlus } from "@phosphor-icons/react/dist/ssr";
import { MarkNotificationsReadButton } from "@/components/MarkNotificationsReadButton";
import { NotificationPreferencesForm } from "@/components/NotificationPreferencesForm";
import { PaginationLinks } from "@/components/PaginationLinks";
import { ProfileBadges } from "@/components/ProfileBadges";
import { UserAvatar } from "@/components/UserAvatar";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";
import { hasNextPage, pageItems, parsePage } from "@/lib/pagination";

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

function notificationCopy(type: string) {
  if (type === "like") return "ha messo like a un tuo post";
  if (type === "comment") return "ha commentato un tuo post";
  if (type === "group_post") return "ha pubblicato nel gruppo";
  return "ha iniziato a seguirti";
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "like") return <Heart size={18} weight="fill" className="text-rose-900" />;
  if (type === "comment") return <ChatCircleText size={18} weight="bold" className="text-fern-900" />;
  if (type === "group_post") return <ChatCircleText size={18} weight="bold" className="text-clay-900" />;
  return <UserPlus size={18} weight="bold" className="text-fern-900" />;
}

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

      <section className="overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
        {visibleNotifications.length ? (
          visibleNotifications.map((notification) => {
            const href = notification.post_id
              ? `/post/${notification.post_id}`
              : `/profile/${notification.actor.id}`;

            return (
              <Link
                key={notification.id}
                href={href}
                className={`grid gap-3 border-b border-charcoal/10 p-4 transition last:border-b-0 hover:bg-paper sm:grid-cols-[auto_1fr_auto] sm:items-start ${
                  notification.read_at ? "" : "bg-fern-100/45"
                }`}
              >
                <div className="flex items-start gap-3">
                  <UserAvatar user={notification.actor} size="sm" />
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-paper">
                    <NotificationIcon type={notification.type} />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="leading-6 text-charcoal/78">
                    <span className="font-semibold text-charcoal">
                      {notification.actor.name}
                    </span>{" "}
                    {notificationCopy(notification.type)}
                  </p>
                  <div className="mt-2">
                    <ProfileBadges role={notification.actor.role} />
                  </div>
                </div>
                <p className="font-mono text-xs text-charcoal/42">
                  {relativeTime(notification.created_at)}
                </p>
              </Link>
            );
          })
        ) : (
          <div className="px-4 py-12">
            <h2 className="text-xl font-semibold tracking-tight text-charcoal">
              Nessuna notifica.
            </h2>
            <p className="mt-2 max-w-[56ch] leading-7 text-charcoal/58">
              Quando qualcuno ti segue, commenta o mette like a un tuo post, lo vedrai qui.
            </p>
          </div>
        )}
      </section>
      <PaginationLinks
        page={page}
        hasNext={hasNextPage(notifications)}
        basePath="/notifications"
      />
    </main>
  );
}
