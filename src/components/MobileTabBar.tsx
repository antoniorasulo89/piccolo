"use client";

import { Bell, ChatCircleText, Compass, House, UserCircle, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCounts } from "@/lib/useUnreadCounts";

type MobileTabBarProps = {
  profileHref?: string;
};

export function MobileTabBar({
  profileHref = "/settings/profile",
}: MobileTabBarProps) {
  const pathname = usePathname();
  const { counts } = useUnreadCounts();

  if (pathname.startsWith("/admin")) return null;

  const items = [
    { href: "/feed", label: "Feed", icon: House, badge: 0 },
    { href: "/explore", label: "Esplora", icon: Compass, badge: 0 },
    { href: "/notifications", label: "Notifiche", icon: Bell, badge: counts.unreadNotifications },
    { href: "/groups", label: "Gruppi", icon: UsersThree, badge: counts.pendingGroupRequests },
    { href: "/messages", label: "DM", icon: ChatCircleText, badge: counts.unreadMessages },
    { href: "/profile", label: "Profilo", icon: UserCircle, badge: 0 },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-charcoal/10 bg-paper/92 px-3 py-2 shadow-[0_-18px_52px_-42px_oklch(22%_0.018_160)] backdrop-blur-md md:hidden">
      <div className="grid grid-cols-6 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const href = item.href === "/profile" ? profileHref : item.href;
          const active =
            item.href === "/profile"
              ? pathname.startsWith("/profile") || pathname.startsWith("/settings")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={href}
              className={`relative grid justify-items-center gap-1 rounded-lg px-1.5 py-2 text-[0.68rem] font-semibold transition active:scale-[0.98] ${
                active
                  ? "bg-charcoal text-paper shadow-[inset_0_3px_0_var(--clay)]"
                  : "text-charcoal/55 hover:bg-clay-100 hover:text-clay-900"
              }`}
            >
              <span className="relative inline-grid">
                <Icon size={20} weight={active ? "fill" : "regular"} />
                {item.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-900 px-1 font-mono text-[0.6rem] font-semibold text-paper">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
