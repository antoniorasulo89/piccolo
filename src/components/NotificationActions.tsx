"use client";

import { Eye, EyeSlash, Trash } from "@phosphor-icons/react";
import { useTransition } from "react";
import { showToast } from "@/components/ToastProvider";

type NotificationActionsProps = {
  id: number;
  isRead: boolean;
  onDeleted: () => void;
  onRead: (read: boolean) => void;
};

export function NotificationActions({ id, isRead, onDeleted, onRead }: NotificationActionsProps) {
  const [pending, startTransition] = useTransition();

  function toggleRead() {
    startTransition(async () => {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (!res.ok) return;
      const data = await res.json();
      onRead(data.read);
      window.dispatchEvent(new CustomEvent("piccolo:refresh-counts"));
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Impossibile rimuovere la notifica.", "error");
        return;
      }
      onDeleted();
      window.dispatchEvent(new CustomEvent("piccolo:refresh-counts"));
    });
  }

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={toggleRead}
        disabled={pending}
        className="rounded-lg p-1.5 text-xs text-charcoal/40 transition hover:bg-charcoal/5 hover:text-charcoal/70 disabled:opacity-50"
        title={isRead ? "Segna non letta" : "Segna letta"}
      >
        {isRead ? <EyeSlash size={14} /> : <Eye size={14} />}
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
