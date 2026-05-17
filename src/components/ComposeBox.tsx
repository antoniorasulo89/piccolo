"use client";

import { Feather, PaperPlaneTilt } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

export function ComposeBox() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const remaining = 280 - content.length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const payload = await response.json();
        const message = payload.error ?? "Pubblicazione non riuscita.";
        setError(message);
        showToast(message, "error");
        return;
      }

      setContent("");
      showToast("Post pubblicato.");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="relative overflow-hidden rounded-lg border border-charcoal/10 bg-linear-to-br from-surface via-surface to-clay-100/42 p-4 shadow-[0_24px_72px_-52px_oklch(24%_0.018_160)]"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-fern-700 via-clay to-rose-900/55" />
      <div aria-hidden="true" className="absolute right-[-2rem] top-[-2rem] h-24 w-24 rounded-full border border-clay/35" />
      <label htmlFor="compose" className="relative flex items-center gap-2 text-sm font-semibold text-charcoal">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-clay-100 text-clay-900">
          <Feather size={16} weight="bold" />
        </span>
        Nuovo pensiero
      </label>
      <textarea
        id="compose"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={280}
        rows={4}
        placeholder="Condividi un pensiero con il gruppo."
        className="relative mt-3 min-h-32 w-full resize-none rounded-lg border border-charcoal/10 bg-paper/92 px-3 py-3 text-base leading-7 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-clay focus:ring-4 focus:ring-clay/15 sm:min-h-28"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p
            className={`font-mono text-xs ${remaining < 24 ? "text-rose-900" : "text-charcoal/45"}`}
          >
            {remaining} caratteri
          </p>
          {error ? <p className="mt-1 text-sm text-rose-900">{error}</p> : null}
        </div>
        <button
          type="submit"
          disabled={pending || !content.trim() || remaining < 0}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
        >
          <PaperPlaneTilt size={17} weight="bold" />
          {pending ? "Invio" : "Pubblica"}
        </button>
      </div>
    </form>
  );
}
