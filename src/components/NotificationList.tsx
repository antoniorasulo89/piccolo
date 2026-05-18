"use client";

import Link from "next/link";
import { Check, ChatCircleText, Heart, UserPlus, X } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { NotificationActions } from "@/components/NotificationActions";
import { ProfileBadges } from "@/components/ProfileBadges";
import { UserAvatar } from "@/components/UserAvatar";
import { showToast } from "./ToastProvider";

type NotificationItem = {
  id: number;
  type: string;
  post_id: number | null;
  comment_id: number | null;
  group_id: number | null;
  group_slug: string | null;
  group_name: string | null;
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

function notificationCopy(type: string, groupName?: string | null) {
  if (type === "like") return "ha messo like a un tuo post";
  if (type === "comment") return "ha commentato un tuo post";
  if (type === "group_post") return groupName ? `ha pubblicato in ${groupName}` : "ha pubblicato nel gruppo";
  if (type === "group_member_invite") return groupName ? `ti ha invitato in ${groupName}` : "ti ha invitato in un gruppo";
  return "ha iniziato a seguirti";
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "like") return <Heart size={18} weight="fill" className="text-rose-900" />;
  if (type === "comment") return <ChatCircleText size={18} weight="bold" className="text-fern-900" />;
  if (type === "group_post") return <ChatCircleText size={18} weight="bold" className="text-clay-900" />;
  if (type === "group_member_invite") return <UserPlus size={18} weight="bold" className="text-clay-900" />;
  return <UserPlus size={18} weight="bold" className="text-fern-900" />;
}

type NotificationListProps = {
  initial: NotificationItem[];
};

export function NotificationList({ initial }: NotificationListProps) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

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

  function respondInvite(groupId: number, accept: boolean, notificationId: number) {
    startTransition(async () => {
      const res = await fetch(`/api/groups/${groupId}/respond-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? "Errore.", "error");
        return;
      }
      showToast(accept ? "Sei entrato nel gruppo." : "Invito rifiutato.");
      handleDeleted(notificationId);
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
      {items.length ? (
        items.map((notification) => {
          const isInvite = notification.type === "group_member_invite";
          const href = isInvite && notification.group_slug
            ? `/groups/${notification.group_slug}`
            : notification.post_id
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
                    {notificationCopy(notification.type, notification.group_name)}
                  </p>
                  <div className="mt-2">
                    <ProfileBadges role={notification.actor.role} />
                  </div>
                </div>
                <p className="font-mono text-xs text-charcoal/42">
                  {relativeTime(notification.created_at)}
                </p>
              </Link>
              <div className="flex items-start gap-2 sm:col-span-3 sm:justify-end">
                {isInvite && notification.group_id ? (
                  <>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => respondInvite(notification.group_id!, true, notification.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-fern-900/70 transition hover:bg-fern-100 hover:text-fern-900 disabled:opacity-50"
                    >
                      <Check size={14} weight="bold" />
                      Entra
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => respondInvite(notification.group_id!, false, notification.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-charcoal/50 transition hover:bg-charcoal/5 hover:text-charcoal disabled:opacity-50"
                    >
                      <X size={14} weight="bold" />
                      Rifiuta
                    </button>
                  </>
                ) : null}
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
