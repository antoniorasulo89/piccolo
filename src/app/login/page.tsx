import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/feed");
  }

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <section className="max-w-md">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          Bentornato
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-charcoal">
          Accedi e torna al tuo feed.
        </h1>
        <AuthForm mode="login" />
      </section>
      <aside className="hidden border-l border-charcoal/10 pl-12 text-charcoal/58 lg:block">
        <p className="max-w-[42ch] text-lg leading-8">
          Il login usa cookie httpOnly e JWT firmato. Il frontend non legge mai
          il token: chiede solo al server cosa puo fare.
        </p>
      </aside>
    </main>
  );
}
