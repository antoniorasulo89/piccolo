import { getCurrentUser } from "@/lib/auth";
import { getPendingGroupRequestsCount } from "@/lib/community";
import { getUnreadMessagesCount } from "@/lib/messages";
import { getUnreadNotificationsCount } from "@/lib/notifications";
import { MobileTabBar } from "./MobileTabBar";

export async function MobileTabBarShell() {
  const user = await getCurrentUser();

  if (!user) return null;

  const [unreadMessages, unreadNotifications, pendingGroupRequests] = await Promise.all([
    getUnreadMessagesCount(user.id),
    getUnreadNotificationsCount(user.id),
    getPendingGroupRequestsCount(user.id),
  ]);

  return (
    <MobileTabBar
      profileHref={`/profile/${user.id}`}
      unreadMessages={unreadMessages}
      unreadNotifications={unreadNotifications}
      pendingGroupRequests={pendingGroupRequests}
    />
  );
}
