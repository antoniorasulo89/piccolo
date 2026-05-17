import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-3xl place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-charcoal">
          Questa pagina non esiste.
        </h1>
        <Link
          href="/feed"
          className="mt-8 inline-flex h-10 items-center rounded-lg bg-charcoal px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px"
        >
          Torna al feed
        </Link>
      </div>
    </main>
  );
}
