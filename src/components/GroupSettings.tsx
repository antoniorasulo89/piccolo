"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { showToast } from "@/components/ToastProvider";

type GroupSettingsProps = {
  groupId: number;
  initialName: string;
  initialDescription: string;
  initialPrivacy: "public" | "private";
};

export function GroupSettings({ groupId, initialName, initialDescription, initialPrivacy }: GroupSettingsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [privacy, setPrivacy] = useState(initialPrivacy);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const body: Record<string, string> = {};
      const name = String(data.get("name")).trim();
      const description = String(data.get("description")).trim();
      if (name !== initialName) body.name = name;
      if (description !== initialDescription) body.description = description;
      if (privacy !== initialPrivacy) body.privacy = privacy;

      if (Object.keys(body).length === 0) {
        showToast("Nessuna modifica da salvare.");
        return;
      }

      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? "Impossibile aggiornare il gruppo.", "error");
        return;
      }
      showToast("Gruppo aggiornato.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="group-name" className="text-sm font-semibold text-charcoal">Nome gruppo</label>
        <input
          id="group-name"
          name="name"
          defaultValue={initialName}
          minLength={2}
          maxLength={60}
          required
          className="h-11 rounded-lg border border-charcoal/10 bg-paper px-3 text-charcoal outline-none transition focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="group-desc" className="text-sm font-semibold text-charcoal">Descrizione</label>
        <textarea
          id="group-desc"
          name="description"
          defaultValue={initialDescription}
          rows={3}
          maxLength={500}
          className="rounded-lg border border-charcoal/10 bg-paper px-3 py-2 text-charcoal outline-none transition focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-charcoal">Privacy</label>
        <div className="flex gap-3">
          {(["public", "private"] as const).map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm font-medium text-charcoal/70">
              <input
                type="radio"
                name="privacy"
                value={value}
                checked={privacy === value}
                onChange={() => setPrivacy(value)}
                className="accent-[var(--fern-900)]"
              />
              {value === "public" ? "Pubblico" : "Privato"}
            </label>
          ))}
        </div>
        <p className="text-xs text-charcoal/45">
          {privacy === "private"
            ? "Solo i membri possono vedere contenuti e conversazioni."
            : "Chiunque puo vedere i post del gruppo."}
        </p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px disabled:opacity-50"
      >
        {pending ? "Salvataggio" : "Salva modifiche"}
      </button>
    </form>
  );
}
