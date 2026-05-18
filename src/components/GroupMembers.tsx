"use client";

import { ShieldCheck, ShieldPlus, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "@/components/ToastProvider";
import { UserAvatar } from "@/components/UserAvatar";

type Member = {
  user_id: number;
  name: string;
  avatar_url: string | null;
  role: "owner" | "co_owner" | "moderator" | "member";
  joined_at: string;
};

type GroupMembersProps = {
  members: Member[];
  groupId: number;
  actorRole: string | null;
  isAdmin: boolean;
};

function canExpelMember(actorRole: string | null, targetRole: string, isAdmin: boolean) {
  if (isAdmin) return targetRole !== "owner";
  if (actorRole === "owner") return targetRole !== "owner";
  if (actorRole === "co_owner") return targetRole !== "owner" && targetRole !== "co_owner";
  if (actorRole === "moderator") return targetRole === "member";
  return false;
}

function canChangeRole(actorRole: string | null, targetRole: string, newRole: string, isAdmin: boolean) {
  if (isAdmin) return targetRole !== "owner" && newRole !== "owner";
  if (actorRole === "owner") return targetRole !== "owner" && newRole !== "owner";
  if (actorRole === "co_owner") {
    return targetRole !== "owner" && targetRole !== "co_owner" && newRole !== "co_owner" && newRole !== "owner";
  }
  return false;
}

function roleBadge(role: string) {
  if (role === "owner") return "text-clay-900 bg-clay-100";
  if (role === "co_owner") return "text-amber-900 bg-amber-100";
  if (role === "moderator") return "text-fern-900 bg-fern-100";
  return "text-charcoal/50";
}

function roleLabel(role: string) {
  if (role === "owner") return "Owner";
  if (role === "co_owner") return "Co-owner";
  if (role === "moderator") return "Moderator";
  return "Membro";
}

export function GroupMembers({ members, groupId, actorRole, isAdmin }: GroupMembersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmExpel, setConfirmExpel] = useState<number | null>(null);

  function expel(userId: number) {
    startTransition(async () => {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? "Impossibile espellere il membro.", "error");
        return;
      }
      setConfirmExpel(null);
      showToast("Membro espulso.");
      router.refresh();
    });
  }

  function changeRole(userId: number, role: string) {
    startTransition(async () => {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? "Impossibile cambiare il ruolo.", "error");
        return;
      }
      showToast("Ruolo aggiornato.");
      router.refresh();
    });
  }

  const showActionsFor = (member: Member) => {
    if (member.role === "owner") return [];
    const actions: { label: string; role: string; icon?: typeof ShieldCheck; className?: string }[] = [];

    if (canChangeRole(actorRole, member.role, "co_owner", isAdmin)) {
      actions.push({ label: "Co-owner", role: "co_owner", icon: ShieldPlus, className: "text-amber-900/70 hover:bg-amber-100 hover:text-amber-900" });
    }
    if (canChangeRole(actorRole, member.role, "moderator", isAdmin)) {
      actions.push({ label: "Moderator", role: "moderator", icon: ShieldCheck, className: "text-fern-900/70 hover:bg-fern-100 hover:text-fern-900" });
    }
    if (canChangeRole(actorRole, member.role, "member", isAdmin) && member.role !== "member") {
      actions.push({ label: "Declassa", role: "member", className: "text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal" });
    }

    return actions;
  };

  return (
    <div className="grid gap-2">
      {members.map((member) => {
        const showExpel = canExpelMember(actorRole, member.role, isAdmin);
        const roleActions = showActionsFor(member);
        const confirming = confirmExpel === member.user_id;

        return (
          <div
            key={member.user_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-charcoal/10 bg-paper p-3"
          >
            <div className="flex items-center gap-3">
              <UserAvatar user={member} size="sm" />
              <div>
                <Link href={`/profile/${member.user_id}`} className="font-semibold text-charcoal hover:underline">
                  {member.name}
                </Link>
                <span className={`ml-2 inline-block rounded-md px-2 py-0.5 text-[0.65rem] font-semibold ${roleBadge(member.role)}`}>
                  {roleLabel(member.role)}
                </span>
              </div>
            </div>

            {confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-900">Confermi espulsione?</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => expel(member.user_id)}
                  className="rounded-lg bg-rose-900 px-3 py-1 text-xs font-semibold text-paper transition hover:bg-rose-800 active:scale-[0.98] disabled:opacity-50"
                >
                  Espelli
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirmExpel(null)}
                  className="rounded-lg border border-charcoal/10 px-2 py-1 text-xs font-medium text-charcoal/50 transition hover:text-charcoal disabled:opacity-50"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                {roleActions.map((action) => (
                  <button
                    key={action.role}
                    type="button"
                    disabled={pending}
                    onClick={() => changeRole(member.user_id, action.role)}
                    className={`rounded-lg px-2 py-1 text-xs font-medium transition disabled:opacity-50 ${action.className ?? ""}`}
                  >
                    {action.icon ? <action.icon size={14} weight="bold" className="inline mr-1" /> : null}
                    {action.label}
                  </button>
                ))}
                {showExpel ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirmExpel(member.user_id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-rose-900/70 transition hover:bg-rose-100 hover:text-rose-900 disabled:opacity-50"
                  >
                    <Trash size={14} weight="bold" className="inline mr-1" />
                    Espelli
                  </button>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
