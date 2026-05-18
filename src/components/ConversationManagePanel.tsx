"use client";

import { Archive, Plus, SignOut, Trash, UserPlus, Users } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";
import { UserAvatar } from "./UserAvatar";

type Member = {
  id: number;
  name: string;
  avatar_url: string | null;
  role: "admin" | "user";
};

type ConversationManagePanelProps = {
  conversationId: number;
  type: "direct" | "group_dm";
  title: string;
  members: Member[];
  isArchived: boolean;
  canManage: boolean;
};

export function ConversationManagePanel({ conversationId, type, title, members, isArchived, canManage }: ConversationManagePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  if (type === "direct") {
    return (
      <div className="mt-4 rounded-lg border border-charcoal/10 bg-paper/72 p-4">
        <p className="text-xs text-charcoal/42">Archivia questa conversazione nella tua lista messaggi.</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => toggleArchive()}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-charcoal/10 px-3 py-1.5 text-xs font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal disabled:opacity-50"
        >
          <Archive size={14} weight="bold" />
          {isArchived ? "Disarchivia" : "Archivia"}
        </button>
      </div>
    );
  }

  function toggleArchive() {
    startTransition(async () => {
      const res = await fetch(`/api/conversations/${conversationId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive: !isArchived }),
      });
      if (res.ok) {
        showToast(isArchived ? "Conversazione disarchiviata." : "Conversazione archiviata.");
        router.refresh();
      }
    });
  }

  function leaveConversation() {
    startTransition(async () => {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        showToast("Hai lasciato la conversazione.");
        router.push("/messages");
      } else {
        const data = await res.json();
        showToast(data.error ?? "Errore.", "error");
      }
    });
  }

  function removeMember(userId: number) {
    startTransition(async () => {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        showToast("Membro rimosso.");
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error ?? "Errore.", "error");
      }
    });
  }

  function addMember(userId: number) {
    startTransition(async () => {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        showToast("Membro aggiunto.");
        setShowAddMember(false);
        setMemberSearch("");
        setSearchResults([]);
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error ?? "Errore.", "error");
      }
    });
  }

  async function searchMembers(query: string) {
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    setSearching(false);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.users.filter((u: Member) => !members.some((m) => m.id === u.id)));
    }
  }

  function renameConversation() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        showToast("Nome aggiornato.");
        setEditingTitle(false);
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error ?? "Errore.", "error");
      }
    });
  }

  return (
    <div className="mt-4 grid gap-4 rounded-lg border border-charcoal/10 bg-paper/72 p-4">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Gestione conversazione</p>

      {canManage && editingTitle ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-charcoal/10 bg-paper px-3 text-sm text-charcoal"
          />
          <button
            type="button"
            disabled={pending}
            onClick={renameConversation}
            className="rounded-lg bg-fern-700 px-3 py-1 text-xs font-semibold text-paper transition hover:bg-fern-900 disabled:opacity-50"
          >
            Salva
          </button>
          <button
            type="button"
            onClick={() => { setEditingTitle(false); setNewTitle(title); }}
            className="rounded-lg border border-charcoal/10 px-2 py-1 text-xs font-medium text-charcoal/50"
          >
            Annulla
          </button>
        </div>
      ) : canManage ? (
        <button
          type="button"
          onClick={() => setEditingTitle(true)}
          className="inline-flex items-center gap-2 text-left text-sm text-charcoal/70 hover:text-charcoal"
        >
          Nome: <span className="font-semibold">{title}</span> (modifica)
        </button>
      ) : (
        <p className="text-sm text-charcoal/70">
          Nome: <span className="font-semibold">{title}</span>
        </p>
      )}

      <div>
        <p className="text-xs font-semibold text-charcoal/50 mb-2">
          <Users size={14} weight="bold" className="inline mr-1" />
          Membri ({members.length})
        </p>
        <div className="grid gap-1">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-clay-100/40">
              <div className="flex items-center gap-2">
                <UserAvatar user={member} size="sm" />
                <span className="text-sm text-charcoal">{member.name}</span>
              </div>
              {canManage ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeMember(member.id)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-rose-900/70 transition hover:bg-rose-100 hover:text-rose-900 disabled:opacity-50"
                >
                  <Trash size={14} weight="bold" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {showAddMember ? (
        <div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => { setMemberSearch(e.target.value); searchMembers(e.target.value); }}
              placeholder="Cerca utente"
              className="h-9 flex-1 rounded-lg border border-charcoal/10 bg-paper px-3 text-sm text-charcoal placeholder:text-charcoal/32"
            />
            <button
              type="button"
              onClick={() => setShowAddMember(false)}
              className="rounded-lg border border-charcoal/10 px-2 py-1 text-xs text-charcoal/50"
            >
              Annulla
            </button>
          </div>
          {searching ? <p className="text-xs text-charcoal/42">Cercando...</p> : null}
          {searchResults.length ? (
            <div className="grid gap-1 max-h-40 overflow-y-auto">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-clay-100/40">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={u} size="sm" />
                    <span className="text-sm text-charcoal">{u.name}</span>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => addMember(u.id)}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-fern-900/70 transition hover:bg-fern-100 hover:text-fern-900 disabled:opacity-50"
                  >
                    <UserPlus size={14} weight="bold" />
                    Aggiungi
                  </button>
                </div>
              ))}
            </div>
          ) : memberSearch.length >= 2 && !searching ? (
            <p className="text-xs text-charcoal/42">Nessun utente trovato.</p>
          ) : null}
        </div>
      ) : canManage ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowAddMember(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-charcoal/10 px-3 py-2 text-xs font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal disabled:opacity-50"
        >
          <Plus size={14} weight="bold" />
          Aggiungi membro
        </button>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-charcoal/10 pt-3">
        <button
          type="button"
          disabled={pending}
          onClick={toggleArchive}
          className="inline-flex items-center gap-2 rounded-lg border border-charcoal/10 px-3 py-1.5 text-xs font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal disabled:opacity-50"
        >
          <Archive size={14} weight="bold" />
          {isArchived ? "Disarchivia" : "Archivia"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={leaveConversation}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-900/15 px-3 py-1.5 text-xs font-semibold text-rose-900 transition hover:bg-rose-100 disabled:opacity-50"
        >
          <SignOut size={14} weight="bold" />
          Lascia
        </button>
      </div>
    </div>
  );
}
