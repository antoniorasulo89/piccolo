import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPendingGroupRequestsCount } from "@/lib/community";
import { getUnreadMessagesCount } from "@/lib/messages";
import { getUnreadNotificationsCount } from "@/lib/notifications";
import { getOpenReportsCount } from "@/lib/reports";
import { BrandMark } from "./BrandMark";
import { NavbarActions } from "./NavbarActions";

export async function Navbar() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <header className="sticky top-0 z-20 border-b border-charcoal/10 bg-paper/86 shadow-[0_16px_42px_-38px_oklch(22%_0.018_160)] backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandMark href="/" />

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 transition hover:bg-charcoal/[0.04] hover:text-charcoal"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-charcoal px-4 py-2 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px"
            >
              Registrati
            </Link>
          </div>
        </nav>
      </header>
    );
  }

  const [unreadNotifications, unreadMessages, pendingGroupRequests, openReports] = await Promise.all([
    getUnreadNotificationsCount(user.id),
    getUnreadMessagesCount(user.id),
    getPendingGroupRequestsCount(user.id),
    user.role === "admin" ? getOpenReportsCount() : Promise.resolve(0),
  ]);

  return (
    <header className="sticky top-0 z-20 border-b border-charcoal/10 bg-paper/86 shadow-[0_16px_42px_-38px_oklch(22%_0.018_160)] backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandMark href="/feed" />
        <NavbarActions
          user={user}
          initial={{ unreadNotifications, unreadMessages, pendingGroupRequests, openReports }}
        />
      </nav>
    </header>
  );
}
