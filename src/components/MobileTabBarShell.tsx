import { getCurrentUser } from "@/lib/auth";
import { MobileTabBar } from "./MobileTabBar";

export async function MobileTabBarShell() {
  const user = await getCurrentUser();
  if (!user) return null;

  return <MobileTabBar profileHref={`/profile/${user.id}`} />;
}
