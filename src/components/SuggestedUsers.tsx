import Link from "next/link";
import type { DiscoverUser } from "@/lib/queries";
import { FollowButton } from "./FollowButton";
import { ProfileBadges } from "./ProfileBadges";
import { UserAvatar } from "./UserAvatar";

export function SuggestedUsers({ users }: { users: DiscoverUser[] }) {
  if (!users.length) return null;

  return (
    <div className="mt-5 border-t border-charcoal/10 pt-5">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/42">
        Suggeriti
      </p>
      <div className="mt-3 grid gap-3">
        {users.map((user) => (
          <article key={user.id} className="grid gap-3 rounded-lg bg-surface p-3">
            <div className="flex items-start gap-3">
              <Link href={`/profile/${user.id}`}>
                <UserAvatar user={user} size="sm" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${user.id}`}
                  className="font-semibold text-charcoal underline-offset-4 hover:underline"
                >
                  {user.name}
                </Link>
                <div className="mt-1">
                  <ProfileBadges role={user.role} isNew={user.is_new} />
                </div>
              </div>
            </div>
            <FollowButton userId={user.id} initialFollowing={false} variant="outline" />
          </article>
        ))}
      </div>
    </div>
  );
}
