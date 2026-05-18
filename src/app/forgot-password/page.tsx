"use client";

import { ArrowRight, Envelope } from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      setSent(true);
    });
  }

  if (sent) {
    return (
      <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-md place-items-center px-4 text-center">
        <div>
          <Envelope size={36} className="mx-auto text-fern-900" weight="duotone" />
          <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
            Email inviata
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-charcoal">
            Controlla la tua casella.
          </h1>
          <p className="mt-3 leading-7 text-charcoal/55">
            Se l&apos;email esiste, riceverai un link per reimpostare la password. Il link scade dopo 30 minuti.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-10 items-center rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px"
          >
            Torna al login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-md place-items-center px-4">
      <div className="w-full">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          Recupero password
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-charcoal">
          Password dimenticata?
        </h1>
        <p className="mt-3 leading-7 text-charcoal/55">
          Inserisci l&apos;email con cui ti sei registrato. Se l&apos;account esiste, riceverai un link per reimpostare la password.
        </p>

        <form onSubmit={submit} className="mt-8 grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-charcoal">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-11 rounded-lg border border-charcoal/10 bg-paper px-3 text-charcoal outline-none transition focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px disabled:opacity-50"
          >
            {pending ? "Invio in corso" : "Invia link reset"}
            <ArrowRight size={17} weight="bold" />
          </button>

          <Link
            href="/login"
            className="text-center text-sm font-semibold text-fern-900 underline-offset-4 hover:underline"
          >
            Torna al login
          </Link>
        </form>
      </div>
    </main>
  );
}
