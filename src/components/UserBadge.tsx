type UserBadgeProps = {
  role?: "admin" | "user";
};

export function UserBadge({ role }: UserBadgeProps) {
  if (role !== "admin") return null;

  return (
    <span className="rounded-md bg-clay/15 px-2 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-clay-900">
      Admin
    </span>
  );
}
