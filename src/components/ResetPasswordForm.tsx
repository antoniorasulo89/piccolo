"use client";

import { Check, Key } from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");

    startTransition(async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error ?? "Reset non riuscito.");
        return;
      }

      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="mt-8 rounded-lg border border-fern-900/15 bg-fern-100 p-4 text-fern-950">
        <div className="flex items-center gap-2 font-semibold">
          <Check size={18} weight="bold" />
          Password aggiornata.
        </div>
        <Link
          href="/login"
          className="mt-3 inline-flex h-10 items-center rounded-lg bg-charcoal px-4 text-sm font-semibold text-paper transition hover:bg-fern-900"
        >
          Vai al login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-charcoal">
          Nuova password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="h-11 rounded-lg border border-charcoal/10 bg-paper px-3 text-charcoal outline-none transition focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
        />
        <p className="text-xs text-charcoal/45">Minimo 8 caratteri.</p>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-900/15 bg-rose-100 px-3 py-2 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !token}
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-charcoal px-5 text-sm font-semibold text-paper transition hover:bg-fern-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Key size={17} weight="bold" />
        {pending ? "Aggiorno" : "Aggiorna password"}
      </button>
    </form>
  );
}
