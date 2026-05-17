"use client";

import { Check, NotePencil, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type EditPostButtonProps = {
  postId: number;
  initialContent: string;
};

export function EditPostButton({ postId, initialContent }: EditPostButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [pending, startTransition] = useTransition();
  const remaining = 280 - content.length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const payload = await response.json();
        showToast(payload.error ?? "Post non modificato.", "error");
        return;
      }

      showToast("Post aggiornato.");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg p-1.5 text-charcoal/35 transition hover:bg-charcoal/[0.06] hover:text-charcoal active:translate-y-px"
        aria-label="Modifica post"
      >
        <NotePencil size={17} />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-lg border border-charcoal/10 bg-paper p-3">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={280}
        rows={3}
        className="min-h-24 w-full resize-none rounded-lg border border-charcoal/10 bg-surface px-3 py-2 text-sm leading-6 text-charcoal outline-none transition focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className={`font-mono text-xs ${remaining < 24 ? "text-rose-900" : "text-charcoal/45"}`}>
          {remaining} caratteri
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setContent(initialContent);
              setOpen(false);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-charcoal/10 px-3 text-sm font-semibold text-charcoal/65 transition hover:border-charcoal/25 hover:text-charcoal"
          >
            <X size={15} weight="bold" />
            Annulla
          </button>
          <button
            type="submit"
            disabled={pending || !content.trim() || remaining < 0 || content === initialContent}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-fern-700 px-3 text-sm font-semibold text-paper transition hover:bg-fern-900 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Check size={15} weight="bold" />
            Salva
          </button>
        </div>
      </div>
    </form>
  );
}
