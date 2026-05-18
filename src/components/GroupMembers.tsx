"use client";

import { ShieldCheck, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "@/components/ToastProvider";
import { UserAvatar } from "@/components/UserAvatar";

type Member = {
  user_id: number;
  name: string;
  avatar_url: string | null;
  role: "owner" | "moderator" | "member";
  joined_at: string;
};

type GroupMembersProps = {
  members: Member[];
  groupId: number;
  canManage: boolean;
};

export function GroupMembers({ members, groupId, canManage }: GroupMembersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function expel(userId: number) {
    startTransition(async () => {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? "Impossibile espellere il membro.", "error");
        return;
      }
      showToast("Membro espulso.");
      router.refresh();
    });
  }

  function changeRole(userId: number, role: "moderator" | "member") {
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

  return (
    <div className="grid gap-2">
      {members.map((member) => {
        const isOwner = member.role === "owner";
        const isModerator = member.role === "moderator";
        const showRoleActions = canManage && !isOwner;

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
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${isOwner ? "text-clay-900" : isModerator ? "text-fern-900" : "text-charcoal/50"}`}>
                    {isOwner ? "Owner" : isModerator ? "Moderator" : "Membro"}
                  </span>
                </div>
              </div>
            </div>

            {showRoleActions ? (
              <div className="flex gap-2">
                {isModerator ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => changeRole(member.user_id, "member")}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-charcoal/50 transition hover:bg-charcoal/5 hover:text-charcoal disabled:opacity-50"
                  >
                    Declassa
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => changeRole(member.user_id, "moderator")}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-fern-900/70 transition hover:bg-fern-100 hover:text-fern-900 disabled:opacity-50"
                  >
                    <ShieldCheck size={14} weight="bold" className="inline mr-1" />
                    Promuovi
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => expel(member.user_id)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-rose-900/70 transition hover:bg-rose-100 hover:text-rose-900 disabled:opacity-50"
                >
                  <Trash size={14} weight="bold" className="inline mr-1" />
                  Espelli
                </button>
              </div>
            ) : isOwner ? (
              <span className="rounded-lg bg-clay-100 px-2 py-1 text-xs font-medium text-clay-900">Owner</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
