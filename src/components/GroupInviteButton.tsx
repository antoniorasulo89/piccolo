"use client";

import { LinkSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { showToast } from "./ToastProvider";

export function GroupInviteButton({ groupId }: { groupId: number }) {
  const [pending, setPending] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  async function createInvite() {
    setPending(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/invites`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? "Invito non creato.", "error");
        return;
      }
      const data = await res.json();
      setInviteUrl(data.inviteUrl);
      await navigator.clipboard.writeText(data.inviteUrl);
      showToast("Link invito copiato negli appunti.");
    } catch {
      showToast("Invito non creato.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={createInvite}
        disabled={pending}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-charcoal/10 bg-paper/70 px-3 text-sm font-semibold text-charcoal/70 transition hover:border-clay hover:bg-clay-100 hover:text-clay-900 active:scale-[0.98] disabled:opacity-50"
      >
        <LinkSimple size={16} weight="bold" />
        {pending ? "Creazione" : "Crea link invito"}
      </button>
      {inviteUrl ? (
        <span className="font-mono text-xs text-charcoal/45 truncate max-w-48">
          Link pronto
        </span>
      ) : null}
    </div>
  );
}
