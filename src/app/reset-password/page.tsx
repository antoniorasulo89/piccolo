import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token = "" } = await searchParams;

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section className="max-w-md">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          Reset password
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-charcoal">
          Imposta una nuova chiave di accesso.
        </h1>
        <p className="mt-4 leading-7 text-charcoal/58">
          Il link è monouso e scade dopo 30 minuti. Dopo il reset puoi rientrare con la nuova password.
        </p>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="mt-8 rounded-lg border border-charcoal/10 bg-surface p-4">
            <h2 className="font-semibold text-charcoal">Link mancante</h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/58">
              Chiedi a un amministratore di generare un nuovo link dalla console.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex h-10 items-center rounded-lg border border-charcoal/10 px-4 text-sm font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal"
            >
              Torna al login
            </Link>
          </div>
        )}
      </section>
      <aside className="hidden border-l border-charcoal/10 pl-12 text-charcoal/58 lg:block">
        <p className="max-w-[42ch] text-lg leading-8">
          Gli admin non vedono la tua password. Generano solo un link temporaneo e il server salva il nuovo hash.
        </p>
      </aside>
    </main>
  );
}
