"use client";

import { Trash, UserPlus } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";
import { UserAvatar } from "./UserAvatar";

type UserSearchResult = {
  id: number;
  name: string;
  avatar_url: string | null;
};

type MemberInviteItem = {
  id: number;
  invited_user_id: number;
  invited_user_name: string;
  invited_user_avatar_url: string | null;
  invited_by: number;
  invited_by_name: string;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  created_at: string;
  responded_at: string | null;
  expires_at: string | null;
};

function statusBadge(s: string) {
  if (s === "pending") return "text-amber-900 bg-amber-100";
  if (s === "accepted") return "text-fern-900 bg-fern-100";
  if (s === "declined") return "text-charcoal/50 bg-charcoal/5";
  if (s === "expired") return "text-charcoal/50 bg-charcoal/5";
  return "text-rose-900 bg-rose-100";
}

function statusLabel(s: string) {
  if (s === "pending") return "In attesa";
  if (s === "accepted") return "Accettato";
  if (s === "declined") return "Rifiutato";
  if (s === "expired") return "Scaduto";
  return "Revocato";
}

export function MemberInvitesPanel({ groupId }: { groupId: number }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, startTransition] = useTransition();
  const [invites, setInvites] = useState<MemberInviteItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function loadInvites() {
    const res = await fetch(`/api/groups/${groupId}/member-invites`);
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invites.filter((i: MemberInviteItem) => i.status === "pending" || i.status === "accepted" || i.status === "declined" || i.status === "revoked"));
    }
    setLoaded(true);
  }

  if (!loaded) {
    loadInvites();
  }

  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&groupId=${groupId}`);
    setSearching(false);
    if (res.ok) {
      const data = await res.json();
      setResults(data.users);
    }
  }, [groupId]);

  function inviteUser(userId: number) {
    startTransition(async () => {
      const res = await fetch(`/api/groups/${groupId}/member-invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? "Invito non creato.", "error");
        return;
      }
      showToast("Utente invitato.");
      setSearch("");
      setResults([]);
      loadInvites();
    });
  }

  function revokeInvite(inviteId: number) {
    startTransition(async () => {
      const res = await fetch(`/api/groups/${groupId}/member-invites/${inviteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? "Invito non revocato.", "error");
        return;
      }
      showToast("Invito revocato.");
      loadInvites();
    });
  }

  return (
    <div>
      <div className="rounded-lg border border-charcoal/10 bg-paper/72 p-5 mb-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42 mb-3">Invita utente registrato</p>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              doSearch(e.target.value);
            }}
            placeholder="Cerca utente per nome"
            className="h-9 w-full rounded-lg border border-charcoal/10 bg-paper px-3 text-sm text-charcoal placeholder:text-charcoal/28"
          />
          {searching ? (
            <span className="absolute right-3 top-2 text-xs text-charcoal/28">Cercando</span>
          ) : null}
        </div>
        {results.length ? (
          <div className="mt-2 grid gap-1 max-h-48 overflow-y-auto">
            {results.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-clay-100/40"
              >
                <div className="flex items-center gap-2">
                  <UserAvatar user={{ name: u.name, avatar_url: u.avatar_url }} size="sm" />
                  <span className="text-sm font-semibold text-charcoal">{u.name}</span>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => inviteUser(u.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-fern-900/70 transition hover:bg-fern-100 hover:text-fern-900 disabled:opacity-50"
                >
                  <UserPlus size={14} weight="bold" />
                  Invita
                </button>
              </div>
            ))}
          </div>
        ) : search.length >= 2 && !searching ? (
          <p className="mt-2 text-xs text-charcoal/42">Nessun utente trovato.</p>
        ) : null}
      </div>

      {invites.length ? (
        <div className="grid gap-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Inviti diretti</p>
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-charcoal/10 bg-paper p-3"
            >
              <div className="flex items-center gap-3">
                <UserAvatar user={{ name: invite.invited_user_name, avatar_url: invite.invited_user_avatar_url }} size="sm" />
                <div>
                  <Link href={`/profile/${invite.invited_user_id}`} className="font-semibold text-charcoal hover:underline">
                    {invite.invited_user_name}
                  </Link>
                  <span className={`ml-2 rounded-md px-2 py-0.5 text-[0.65rem] font-semibold ${statusBadge(invite.status)}`}>
                    {statusLabel(invite.status)}
                  </span>
                  {invite.status === "pending" ? (
                    <p className="text-xs text-charcoal/42 mt-0.5">Invitato da {invite.invited_by_name}</p>
                  ) : null}
                </div>
              </div>
              {invite.status === "pending" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => revokeInvite(invite.id)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-rose-900/70 transition hover:bg-rose-100 hover:text-rose-900 disabled:opacity-50"
                >
                  <Trash size={14} weight="bold" className="inline mr-1" />
                  Revoca
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
