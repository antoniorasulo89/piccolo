import Link from "next/link";
import { Bell } from "@phosphor-icons/react/dist/ssr";

type NotificationBellProps = {
  count: number;
};

export function NotificationBell({ count }: NotificationBellProps) {
  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-charcoal/10 text-charcoal/65 transition hover:border-charcoal/20 hover:bg-charcoal/[0.04] hover:text-charcoal active:scale-[0.98]"
      aria-label={count ? `${count} notifiche non lette` : "Notifiche"}
    >
      <Bell size={19} weight={count ? "fill" : "regular"} />
      {count ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-900 px-1 font-mono text-[0.65rem] font-semibold text-paper animate-pulse-soft">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
