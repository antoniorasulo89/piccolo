"use client";

import { ArrowRight, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "@/components/ToastProvider";

export default function GroupJoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [pending, startTransition] = useTransition();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  const tokenMissingError = !token ? "Link non valido. Manca il token di invito." : "";
  const visibleError = error || tokenMissingError;

  function join() {
    if (!token) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.status === 401) {
          router.push(`/login?redirect=/groups/join?token=${encodeURIComponent(token)}`);
          return;
        }
        if (!res.ok) {
          setError(data.error ?? "Impossibile unirsi al gruppo.");
          return;
        }
        setJoined(true);
        showToast("Ti sei unito al gruppo.");
        router.push(`/groups/${data.groupId}`);
      } catch {
        setError("Errore di rete. Riprova.");
      }
    });
  }

  if (!token || visibleError) {
    return (
      <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-xl place-items-center px-4 text-center">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">Invito</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-charcoal">
            {visibleError || "Link non valido."}
          </h1>
          <p className="mt-3 max-w-[48ch] mx-auto leading-7 text-charcoal/55">
            Il link di invito non e valido o e scaduto. Chiedi un nuovo link a chi gestisce il gruppo.
          </p>
          <Link
            href="/groups"
            className="mt-8 inline-flex h-10 items-center rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px"
          >
            Torna ai gruppi
          </Link>
        </div>
      </main>
    );
  }

  if (joined) {
    return (
      <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-xl place-items-center px-4 text-center">
        <div>
          <UsersThree size={40} className="mx-auto text-fern-900" weight="duotone" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-charcoal">Ti sei unito al gruppo.</h1>
          <p className="mt-3 leading-7 text-charcoal/55">Ti stiamo reindirizzando alla pagina del gruppo.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-xl place-items-center px-4 text-center">
      <div>
        <UsersThree size={40} className="mx-auto text-fern-900" weight="duotone" />
        <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">Invito gruppo</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-charcoal">
          Sei stato invitato a unirti a un gruppo.
        </h1>
        <p className="mt-3 max-w-[48ch] mx-auto leading-7 text-charcoal/55">
          Clicca il pulsante qui sotto per entrare nel gruppo. Riceverai il ruolo di membro.
        </p>
        <button
          type="button"
          onClick={join}
          disabled={pending}
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-fern-700 px-6 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px disabled:opacity-50"
        >
          <ArrowRight size={17} weight="bold" />
          {pending ? "Accesso in corso" : "Entra nel gruppo"}
        </button>
      </div>
    </main>
  );
}
