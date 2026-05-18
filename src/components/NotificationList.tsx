"use client";

import Link from "next/link";
import { ChatCircleText, Heart, UserPlus } from "@phosphor-icons/react";
import { useState } from "react";
import { NotificationActions } from "@/components/NotificationActions";
import { ProfileBadges } from "@/components/ProfileBadges";
import { UserAvatar } from "@/components/UserAvatar";

type NotificationItem = {
  id: number;
  type: string;
  post_id: number | null;
  read_at: string | null;
  created_at: string;
  actor: {
    id: number;
    name: string;
    avatar_url: string | null;
    role: "admin" | "user";
  };
};

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(Math.floor(diff / 60000), 0);
  if (minutes < 1) return "ora";
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h fa`;
  return `${Math.floor(hours / 24)} g fa`;
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

type NotificationListProps = {
  initial: NotificationItem[];
};

export function NotificationList({ initial }: NotificationListProps) {
  const [items, setItems] = useState(initial);

  function handleDeleted(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleRead(id: number, read: boolean) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read_at: read ? new Date().toISOString() : null } : item
      )
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
      {items.length ? (
        items.map((notification) => {
          const href = notification.post_id
            ? `/post/${notification.post_id}`
            : `/profile/${notification.actor.id}`;

          return (
            <div
              key={notification.id}
              className={`grid gap-3 border-b border-charcoal/10 p-4 transition last:border-b-0 sm:grid-cols-[auto_1fr_auto] sm:items-start ${
                notification.read_at ? "" : "bg-fern-100/45"
              }`}
            >
              <Link href={href} className="contents">
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
              <div className="flex items-start justify-end sm:col-span-3 sm:justify-end">
                <NotificationActions
                  id={notification.id}
                  isRead={Boolean(notification.read_at)}
                  onDeleted={() => handleDeleted(notification.id)}
                  onRead={(read) => handleRead(notification.id, read)}
                />
              </div>
            </div>
          );
        })
      ) : (
        <div className="px-4 py-12">
          <h2 className="text-xl font-semibold tracking-tight text-charcoal">Nessuna notifica.</h2>
          <p className="mt-2 max-w-[56ch] leading-7 text-charcoal/58">
            Quando qualcuno ti segue, commenta o mette like a un tuo post, lo vedrai qui.
          </p>
        </div>
      )}
    </div>
  );
}
