"use client";

import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { safeRedirectPath } from "@/lib/redirect";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();
  const isRegister = mode === "register";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data);

    startTransition(async () => {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? "Richiesta non riuscita.");
        return;
      }

      const body = await response.json();
      if (isRegister) {
        if (body.pendingApproval) {
          setSuccess("Account creato. Un amministratore deve approvarlo prima dell'accesso.");
          form.reset();
          return;
        }
        router.push("/login");
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push(body.onboarded ? "/feed" : "/onboarding");
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4">
      {isRegister ? (
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-semibold text-charcoal">
            Nome
          </label>
          <input
            id="name"
            name="name"
            minLength={2}
            maxLength={48}
            required
            className="h-11 rounded-lg border border-charcoal/10 bg-paper px-3 text-charcoal outline-none transition focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
          />
        </div>
      ) : null}

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

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-charcoal">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
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
      {success ? (
        <p className="rounded-lg border border-fern-700/15 bg-fern-100 px-3 py-2 text-sm text-fern-900">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px disabled:opacity-50"
      >
        {pending ? "Attendi" : isRegister ? "Crea account" : "Entra"}
        <ArrowRight size={17} weight="bold" />
      </button>

      <p className="text-sm text-charcoal/55">
        {isRegister ? "Hai già un account?" : "Non hai ancora un account?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-semibold text-fern-900 underline-offset-4 hover:underline"
        >
          {isRegister ? "Fai login" : "Registrati"}
        </Link>
      </p>
      {!isRegister ? (
        <p className="text-sm text-charcoal/50">
          <Link href="/forgot-password" className="font-semibold text-fern-900 underline-offset-4 hover:underline">
            Password dimenticata?
          </Link>
        </p>
      ) : null}
    </form>
  );
}
