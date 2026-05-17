import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { ProfileCover } from "@/components/ProfileCover";
import { UserAvatar } from "@/components/UserAvatar";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
        <ProfileCover src={user.cover_url} name={user.name} />
        <div className="relative grid gap-8 px-5 pb-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="relative z-10 -mt-12 inline-flex rounded-full bg-paper p-1 shadow-[0_18px_46px_-30px_oklch(22%_0.018_160)]">
              <UserAvatar user={user} size="lg" />
            </div>
            <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
              Impostazioni
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-charcoal">
              Personalizza il tuo profilo.
            </h1>
            <p className="mt-4 max-w-[62ch] leading-7 text-charcoal/60">
              Aggiorna nome, bio, avatar e copertina. Queste informazioni
              appaiono nel profilo pubblico e nella pagina Esplora.
            </p>
          </div>
        </div>
      </section>

      <ProfileSettingsForm user={user} />
    </main>
  );
}
