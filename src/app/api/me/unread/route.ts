import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPendingGroupRequestsCount } from "@/lib/community";
import { getUnreadMessagesCount } from "@/lib/messages";
import { getUnreadNotificationsCount } from "@/lib/notifications";
import { getOpenReportsCount } from "@/lib/reports";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const [unreadNotifications, unreadMessages, pendingGroupRequests, openReports] =
    await Promise.all([
      getUnreadNotificationsCount(user.id),
      getUnreadMessagesCount(user.id),
      getPendingGroupRequestsCount(user.id),
      user.role === "admin" ? getOpenReportsCount() : Promise.resolve(0),
    ]);

  return NextResponse.json({
    unreadNotifications,
    unreadMessages,
    pendingGroupRequests,
    openReports,
  });
}
