import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ChatCircleText,
  CirclesThreePlus,
  ShieldCheck,
  UserPlus,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { BrandMark } from "@/components/BrandMark";
import { getCurrentUser } from "@/lib/auth";

type FeatureItem = {
  title: string;
  text: string;
  icon: Icon;
  tone: "fern" | "clay" | "rose";
};

const toneClasses = {
  fern: "bg-fern-100 text-fern-900",
  clay: "bg-clay-100 text-clay-900",
  rose: "bg-rose-100 text-rose-900",
} as const;

const FEATURES: FeatureItem[] = [
  {
    title: "Post brevi",
    text: "280 caratteri per pensieri nitidi. Niente scroll infinito, niente algoritmi.",
    icon: ChatCircleText,
    tone: "fern",
  },
  {
    title: "Gruppi",
    text: "Pubblici o privati, con ruoli, moderazione e richieste di accesso.",
    icon: UsersThree,
    tone: "clay",
  },
  {
    title: "Moderazione",
    text: "Strumenti di controllo: ruoli, segnalazioni, audit log e console admin.",
    icon: ShieldCheck,
    tone: "rose",
  },
  {
    title: "Profili",
    text: "Identità curate, privacy regolabile, notifiche personalizzate.",
    icon: UserPlus,
    tone: "fern",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/feed");
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)]">
      {/* Hero */}
      <section className="relative mx-auto grid max-w-7xl gap-12 overflow-hidden px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8 lg:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[-6rem] top-[-4rem] h-64 w-64 rounded-full border border-charcoal/8" />
          <div className="absolute right-16 top-28 h-14 w-14 rounded-full border border-clay/30" />
          <div className="absolute bottom-16 left-[-3rem] grid h-36 w-36 grid-cols-3 gap-2 opacity-30">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="rounded-full bg-charcoal/8" style={{ opacity: 0.2 + (i % 3) * 0.15 }} />
            ))}
          </div>
        </div>

        <div className="relative max-w-3xl">
          <BrandMark href="/" />
          <p className="mt-10 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-fern-900">
            Meno rumore. Più relazione.
          </p>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-charcoal sm:text-6xl">
            Il social piccolo per le community che contano.
          </h1>
          <p className="mt-6 max-w-[58ch] text-lg leading-8 text-charcoal/60">
            Crea uno spazio privato, leggero e controllato dove il tuo gruppo può
            pubblicare, commentare, scriversi e collaborare senza il rumore dei grandi social.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-fern-700 px-5 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px"
            >
              Crea la tua community
              <ArrowRight size={17} weight="bold" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-charcoal/10 px-5 text-sm font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal active:translate-y-px"
            >
              Ho già un account
            </Link>
          </div>
        </div>

        {/* Desktop bento */}
        <div className="relative hidden gap-4 lg:grid lg:grid-cols-4 lg:grid-rows-3 lg:pt-16">
          {FEATURES.map(({ title, text, icon: Icon, tone }, i) => (
            <div
              key={title}
              className={`${i < 2 ? "col-span-2 row-span-2" : "col-span-2"} rounded-2xl border border-charcoal/8 bg-surface/80 p-6 shadow-[0_16px_48px_-36px_oklch(22%_0.018_160)]`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-9 w-9 place-items-center rounded-full ${toneClasses[tone]}`}>
                  <Icon size={18} weight="bold" />
                </span>
                <span className="font-semibold text-charcoal text-sm">{title}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-charcoal/55">{text}</p>
            </div>
          ))}
        </div>

        {/* Mobile list */}
        <div className="grid gap-4 lg:hidden">
          {FEATURES.map(({ title, text, icon: Icon, tone }) => (
            <div key={title} className="rounded-xl border border-charcoal/8 bg-surface/80 p-5">
              <div className="flex items-center gap-3">
                <span className={`grid h-9 w-9 place-items-center rounded-full ${toneClasses[tone]}`}>
                  <Icon size={18} weight="bold" />
                </span>
                <span className="font-semibold text-charcoal">{title}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-charcoal/55">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Come funziona */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-fern-900 text-center">
          Come funziona
        </p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-charcoal text-center">
          Tre passi. Nessuna complicazione.
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Crea il tuo spazio",
              text: "Registrati e crea un gruppo privato per la tua community. Scegli un nome, una descrizione e il livello di privacy.",
              icon: CirclesThreePlus,
            },
            {
              step: "2",
              title: "Invita le persone",
              text: "Condividi il link del gruppo. I membri possono unirsi liberamente o richiedere l'accesso in base alle tue impostazioni.",
              icon: UserPlus,
            },
            {
              step: "3",
              title: "Pubblica e collabora",
              text: "Scrivi post brevi, commenta, usa i like e i messaggi diretti. Tutto in uno spazio raccolto e senza rumore.",
              icon: ChatCircleText,
            },
          ].map(({ step, title, text, icon: Icon }) => (
            <div key={step} className="rounded-2xl border border-charcoal/8 bg-surface/80 p-8 text-center">
              <span className="inline-grid h-12 w-12 place-items-center rounded-full bg-fern-100 text-fern-900 font-mono text-sm font-bold">
                {step}
              </span>
              <Icon size={28} className="mt-6 mx-auto text-fern-900" weight="duotone" />
              <h3 className="mt-5 text-lg font-semibold text-charcoal">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-charcoal/55 max-w-[36ch] mx-auto">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Per chi è */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_2fr] lg:items-start">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay-900">
              Per chi è
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-charcoal">
              Piccolo non è per tutti. Ed è un vantaggio.
            </h2>
            <p className="mt-4 max-w-[38ch] leading-7 text-charcoal/55">
              Non serve essere un social enorme per funzionare bene. A volte basta uno spazio della misura giusta.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Team", desc: "Comunicazione interna senza canali infiniti." },
              { label: "Corsi", desc: "Spazio riservato per docenti e studenti." },
              { label: "Associazioni", desc: "Coordinamento semplice tra soci." },
              { label: "Community", desc: "Gruppi raccolti con moderazione reale." },
            ].map(({ label, desc }) => (
              <div key={label} className="rounded-xl border border-charcoal/8 bg-paper p-6">
                <h3 className="font-semibold text-charcoal">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-charcoal/55">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-fern-900">
          Meno rumore. Più relazione.
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight text-charcoal">
          Pronto a creare il tuo spazio?
        </h2>
        <p className="mt-4 max-w-[52ch] mx-auto text-lg leading-8 text-charcoal/55">
          In meno di un minuto hai un social privato per il tuo gruppo, con tutti gli strumenti per gestirlo.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-fern-700 px-6 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px"
        >
          Crea la tua community
          <ArrowRight size={17} weight="bold" />
        </Link>
      </section>
    </main>
  );
}
