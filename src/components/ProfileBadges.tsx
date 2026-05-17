import { UserBadge } from "./UserBadge";

type ProfileBadgesProps = {
  role: "admin" | "user";
  isNew?: boolean;
  followed?: boolean;
};

export function ProfileBadges({
  role,
  isNew = false,
  followed,
}: ProfileBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <UserBadge role={role} />
      {followed ? (
        <span className="rounded-md bg-fern-100 px-2 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-fern-900">
          Seguito
        </span>
      ) : null}
      {isNew ? (
        <span className="rounded-md bg-charcoal/[0.06] px-2 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-charcoal/62">
          Nuovo
        </span>
      ) : null}
    </div>
  );
}
