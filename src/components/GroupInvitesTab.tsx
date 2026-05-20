"use client";

import { LinkSimple, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { formatAppDateTime } from "@/lib/dates";
import { showToast } from "./ToastProvider";

type InviteItem = {
  id: number;
  created_by: { id: number; name: string } | null;
  max_uses: number | null;
  used_count: number;
  created_at: string;
  expires_at: string | null;
  status: "active" | "expired" | "exhausted" | "revoked";
};

function statusBadge(s: string) {
  if (s === "active") return "text-fern-900 bg-fern-100";
  if (s === "expired") return "text-charcoal/50 bg-charcoal/5";
  if (s === "exhausted") return "text-amber-900 bg-amber-100";
  return "text-rose-900 bg-rose-100";
}

function statusLabel(s: string) {
  if (s === "active") return "Attivo";
  if (s === "expired") return "Scaduto";
  if (s === "exhausted") return "Esaurito";
  return "Revocato";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return formatAppDateTime(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GroupInvitesTab({ groupId }: { groupId: number }) {
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState("");
  const [expiresHours, setExpiresHours] = useState("");

  async function loadInvites() {
    const res = await fetch(`/api/groups/${groupId}/invites`);
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invites);
    }
    setLoaded(true);
  }

  if (!loaded) {
    loadInvites();
    return <div className="p-4 text-center text-sm text-charcoal/42">Caricamento inviti</div>;
  }

  async function createInvite() {
    setCreating(true);
    setCreatedInviteUrl(null);
    try {
      const body: Record<string, number> = {};
      if (maxUses) body.max_uses = Number(maxUses);
      if (expiresHours) body.expires_in_hours = Number(expiresHours);

      const res = await fetch(`/api/groups/${groupId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? "Invito non creato.", "error");
        return;
      }
      const data = await res.json();
      setCreatedInviteUrl(data.inviteUrl);
      await navigator.clipboard.writeText(data.inviteUrl);
      showToast("Link invito copiato negli appunti.");
      setMaxUses("");
      setExpiresHours("");
      loadInvites();
    } catch {
      showToast("Invito non creato.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function revokeInvite(inviteId: number) {
    setPending(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/invites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? "Invito non revocato.", "error");
        return;
      }
      showToast("Invito revocato.");
      loadInvites();
    } catch {
      showToast("Invito non revocato.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="rounded-lg border border-charcoal/10 bg-paper/72 p-5 mb-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42 mb-3">Crea link invito</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-1">
            <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-charcoal/42">Max utilizzi</span>
            <input
              type="number"
              min={1}
              max={1000}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Illimitato"
              className="h-9 rounded-lg border border-charcoal/10 bg-paper px-3 text-sm text-charcoal placeholder:text-charcoal/28"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-charcoal/42">Scadenza (ore)</span>
            <input
              type="number"
              min={1}
              max={720}
              value={expiresHours}
              onChange={(e) => setExpiresHours(e.target.value)}
              placeholder="Nessuna"
              className="h-9 rounded-lg border border-charcoal/10 bg-paper px-3 text-sm text-charcoal placeholder:text-charcoal/28"
            />
          </label>
          <button
            type="button"
            onClick={createInvite}
            disabled={creating}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-charcoal/10 bg-paper/70 px-3 text-sm font-semibold text-charcoal/70 transition hover:border-clay hover:bg-clay-100 hover:text-clay-900 active:scale-[0.98] disabled:opacity-50"
          >
            <LinkSimple size={16} weight="bold" />
            {creating ? "Creazione" : "Crea"}
          </button>
        </div>
        {createdInviteUrl ? (
          <div className="mt-3 rounded-lg bg-clay-100/50 p-3">
            <p className="text-xs font-semibold text-clay-900 mb-1">Link copiato:</p>
            <code className="block break-all text-xs text-charcoal/70">{createdInviteUrl}</code>
          </div>
        ) : null}
      </div>

      {invites.length ? (
        <div className="grid gap-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Inviti attivi e passati</p>
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-charcoal/10 bg-paper p-3"
            >
              <div className="grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[0.65rem] font-semibold ${statusBadge(invite.status)}`}>
                    {statusLabel(invite.status)}
                  </span>
                  <span className="text-xs text-charcoal/45">
                    {invite.used_count}/{invite.max_uses ?? "∞"} utilizzi
                  </span>
                </div>
                <p className="text-xs text-charcoal/42">
                  {invite.created_by ? `Creato da ${invite.created_by.name}` : "Creato da sconosciuto"}
                  {invite.expires_at ? ` · Scade ${formatDate(invite.expires_at)}` : " · Senza scadenza"}
                  {" · "}{formatDate(invite.created_at)}
                </p>
              </div>
              {invite.status === "active" ? (
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
      ) : (
        <div className="rounded-lg border border-charcoal/10 bg-surface p-8 text-center">
          <p className="text-sm text-charcoal/45">Nessun invito creato. Usa il box sopra per creare il primo link.</p>
        </div>
      )}
    </div>
  );
}
