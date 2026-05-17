import { redirect } from "next/navigation";
import { AccountPrivacyForm } from "@/components/AccountPrivacyForm";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { ThemePreferenceForm } from "@/components/ThemePreferenceForm";
import { getCurrentUser } from "@/lib/auth";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <section className="border-b border-charcoal/10 pb-7">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          Account
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-charcoal">
          Privacy, tema e dati.
        </h1>
        <p className="mt-4 max-w-[62ch] leading-7 text-charcoal/60">
          Gestisci come il tuo profilo viene trovato e cosa succede ai tuoi dati.
        </p>
      </section>

      <section className="py-8">
        <h2 className="text-2xl font-semibold tracking-tight text-charcoal">
          Aspetto
        </h2>
        <p className="mt-1 text-sm text-charcoal/50">
          Scegli il tema dell&apos;interfaccia per questo account.
        </p>
        <div className="mt-4">
          <ThemePreferenceForm
            initialTheme={
              user.theme_preference === "dark"
                ? "dark"
                : user.theme_preference === "light"
                  ? "light"
                  : "system"
            }
          />
        </div>
      </section>

      <section className="border-t border-charcoal/10 py-8">
        <h2 className="text-2xl font-semibold tracking-tight text-charcoal">
          Privacy
        </h2>
        <p className="mt-1 text-sm text-charcoal/50">
          Queste opzioni influenzano Esplora e la ricerca utenti.
        </p>
        <div className="mt-4">
          <AccountPrivacyForm
            initial={{
              privacy_show_email: Boolean(user.privacy_show_email),
              privacy_discoverable: Boolean(user.privacy_discoverable),
            }}
          />
        </div>
      </section>

      <section className="border-t border-charcoal/10 py-8">
        <h2 className="text-2xl font-semibold tracking-tight text-charcoal">
          Zona delicata
        </h2>
        <p className="mt-1 max-w-[58ch] text-sm leading-6 text-charcoal/55">
          Eliminare l&apos;account rimuove profilo, post, commenti, like, follow e notifiche collegati.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </section>
    </main>
  );
}
