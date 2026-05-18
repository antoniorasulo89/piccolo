"use client";

import { BookmarkSimple, MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import type { PublicUser } from "@/lib/db";
import { useUnreadCounts } from "@/lib/useUnreadCounts";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

type UnreadData = {
  unreadNotifications: number;
  unreadMessages: number;
  pendingGroupRequests: number;
  openReports: number;
};

type NavbarActionsProps = {
  user: PublicUser;
  initial: UnreadData;
};

export function NavbarActions({ user, initial }: NavbarActionsProps) {
  const { counts } = useUnreadCounts(initial);

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <div className="hidden items-center gap-1 md:flex">
        <Link
          href="/feed"
          className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 transition hover:bg-clay-100 hover:text-clay-900 active:scale-[0.98]"
        >
          Feed
        </Link>
        <Link
          href="/explore"
          className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 transition hover:bg-clay-100 hover:text-clay-900 active:scale-[0.98]"
        >
          Esplora
        </Link>
        <Link
          href="/groups"
          className="relative rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 transition hover:bg-clay-100 hover:text-clay-900 active:scale-[0.98]"
        >
          Gruppi
          {counts.pendingGroupRequests > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 font-mono text-[0.68rem] font-semibold text-amber-900">
              {counts.pendingGroupRequests}
            </span>
          )}
        </Link>
        <Link
          href="/messages"
          className="relative rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 transition hover:bg-clay-100 hover:text-clay-900 active:scale-[0.98]"
        >
          Messaggi
          {counts.unreadMessages > 0 && (
            <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.5 font-mono text-[0.68rem] font-semibold text-rose-900">
              {counts.unreadMessages}
            </span>
          )}
        </Link>
      </div>
      <div className="flex items-center gap-2 border-l border-charcoal/10 pl-2">
        <Link
          href="/search"
          aria-label="Cerca"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-charcoal/10 text-charcoal/65 transition hover:border-charcoal/20 hover:bg-clay-100 hover:text-clay-900 active:scale-[0.98]"
        >
          <MagnifyingGlass size={19} weight="bold" />
        </Link>
        <Link
          href="/saved"
          aria-label="Salvati"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-charcoal/10 text-charcoal/65 transition hover:border-charcoal/20 hover:bg-clay-100 hover:text-clay-900 active:scale-[0.98]"
        >
          <BookmarkSimple size={19} weight="bold" />
        </Link>
        <NotificationBell count={counts.unreadNotifications} />
        <UserMenu user={user} openReports={counts.openReports} />
      </div>
    </div>
  );
}
