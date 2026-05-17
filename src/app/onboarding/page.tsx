import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/OnboardingForm";
import { getCurrentUser } from "@/lib/auth";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.onboarded_at) {
    redirect("/feed");
  }

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-5xl items-center px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section className="max-w-lg">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          Primo setup
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-charcoal">
          Dai un contesto al tuo profilo.
        </h1>
        <p className="mt-4 max-w-[58ch] leading-7 text-charcoal/60">
          Basta una riga: aiuta gli altri utenti a capire cosa condividi e rende la directory piu utile.
        </p>
        <OnboardingForm initialBio={user.bio} />
      </section>
      <aside className="hidden rounded-lg border border-charcoal/10 bg-surface p-6 text-charcoal/62 lg:block">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">
          Poi
        </p>
        <p className="mt-3 leading-7">
          Dopo questo passaggio ti porto in Esplora, cosi puoi trovare persone da seguire e popolare il feed.
        </p>
      </aside>
    </main>
  );
}
