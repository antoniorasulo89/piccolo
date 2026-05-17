"use client";

import { LockKey, Plus, UsersThree } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

export function GroupCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          privacy: form.get("privacy"),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        const message = payload.error ?? "Gruppo non creato.";
        setError(message);
        showToast(message, "error");
        return;
      }

      showToast("Gruppo creato.");
      router.push(`/groups/${payload.slug}`);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="relative overflow-hidden rounded-lg border border-charcoal/10 bg-linear-to-br from-surface via-surface to-clay-100/34 p-4 shadow-[0_24px_72px_-54px_oklch(22%_0.018_160)]"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-fern-700 via-clay to-rose-900/55" />
      <div className="grid gap-4">
        <div>
          <label htmlFor="group-name" className="flex items-center gap-2 text-sm font-semibold text-charcoal">
            <UsersThree size={17} weight="bold" className="text-clay-900" />
            Nome gruppo
          </label>
          <input
            id="group-name"
            name="name"
            minLength={3}
            maxLength={60}
            required
            placeholder="Club letture brevi"
            className="mt-2 h-11 w-full rounded-lg border border-charcoal/10 bg-paper px-3 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-clay focus:ring-4 focus:ring-clay/15"
          />
        </div>

        <div>
          <label htmlFor="group-description" className="text-sm font-semibold text-charcoal">
            Descrizione
          </label>
          <textarea
            id="group-description"
            name="description"
            maxLength={220}
            rows={3}
            placeholder="Di cosa si parla qui?"
            className="mt-2 w-full resize-none rounded-lg border border-charcoal/10 bg-paper px-3 py-3 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-clay focus:ring-4 focus:ring-clay/15"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-charcoal">Privacy</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-charcoal/10 bg-paper/70 p-3 text-sm font-medium text-charcoal/72 transition hover:border-clay">
              <input type="radio" name="privacy" value="public" defaultChecked />
              <UsersThree size={17} />
              Pubblico
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-charcoal/10 bg-paper/70 p-3 text-sm font-medium text-charcoal/72 transition hover:border-clay">
              <input type="radio" name="privacy" value="private" />
              <LockKey size={17} />
              Privato
            </label>
          </div>
        </div>

        {error ? <p className="text-sm text-rose-900">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px disabled:opacity-50"
        >
          <Plus size={17} weight="bold" />
          {pending ? "Creo" : "Crea gruppo"}
        </button>
      </div>
    </form>
  );
}
