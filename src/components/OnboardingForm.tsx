"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

export function OnboardingForm({ initialBio = "" }: { initialBio?: string }) {
  const router = useRouter();
  const [bio, setBio] = useState(initialBio);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const remaining = 160 - bio.length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });

      if (!response.ok) {
        const payload = await response.json();
        const message = payload.error ?? "Onboarding non salvato.";
        setError(message);
        showToast(message, "error");
        return;
      }

      showToast("Profilo pronto.");
      router.push("/explore");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="bio" className="text-sm font-semibold text-charcoal">
          Bio breve
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={160}
          rows={4}
          placeholder="Di cosa parlerai su Piccolo?"
          className="min-h-28 resize-none rounded-lg border border-charcoal/10 bg-paper px-3 py-3 leading-7 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
        />
        <p className={`font-mono text-xs ${remaining < 20 ? "text-rose-900" : "text-charcoal/45"}`}>
          {remaining} caratteri
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-900/15 bg-rose-100 px-3 py-2 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || remaining < 0}
        className="inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-fern-700 px-5 text-sm font-semibold text-paper transition hover:bg-fern-900 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Salvataggio" : "Continua"}
        <ArrowRight size={17} weight="bold" />
      </button>
    </form>
  );
}
