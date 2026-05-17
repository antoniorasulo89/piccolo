import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/feed");
  }

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <section className="max-w-md">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          Nuovo account
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-charcoal">
          Entra nel tuo spazio Piccolo.
        </h1>
        <AuthForm mode="register" />
      </section>
      <aside className="hidden border-l border-charcoal/10 pl-12 text-charcoal/58 lg:block">
        <p className="max-w-[44ch] text-lg leading-8">
          Solo nome, email e password. Il resto del valore arriva dalle persone che scegli,
          dai gruppi che costruisci, dai contenuti che condividi.
        </p>
      </aside>
    </main>
  );
}
