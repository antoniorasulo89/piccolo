"use client";

import { Eye, EyeSlash, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "@/components/ToastProvider";

export function NotificationActions({ id, isRead }: { id: number; isRead: boolean }) {
  const router = useRouter();
  const [read, setRead] = useState(isRead);
  const [deleted, setDeleted] = useState(false);
  const [pending, startTransition] = useTransition();

  if (deleted) return null;

  function toggleRead() {
    startTransition(async () => {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (!res.ok) return;
      const data = await res.json();
      setRead(data.read);
      window.dispatchEvent(new CustomEvent("piccolo:refresh-counts"));
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Impossibile rimuovere la notifica.", "error");
        return;
      }
      setDeleted(true);
      window.dispatchEvent(new CustomEvent("piccolo:refresh-counts"));
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={toggleRead}
        disabled={pending}
        className="rounded-lg p-1.5 text-xs text-charcoal/40 transition hover:bg-charcoal/5 hover:text-charcoal/70 disabled:opacity-50"
        title={read ? "Segna non letta" : "Segna letta"}
      >
        {read ? <EyeSlash size={14} /> : <Eye size={14} />}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="rounded-lg p-1.5 text-xs text-charcoal/40 transition hover:bg-rose-100 hover:text-rose-900 disabled:opacity-50"
        title="Rimuovi"
      >
        <Trash size={14} />
      </button>
    </div>
  );
}
