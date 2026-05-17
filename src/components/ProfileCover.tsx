import { SmartImage } from "./SmartImage";

type ProfileCoverProps = {
  src?: string | null;
  name: string;
};

export function ProfileCover({ src, name }: ProfileCoverProps) {
  return (
    <div className="relative h-40 overflow-hidden rounded-t-lg bg-[radial-gradient(circle_at_18%_12%,var(--clay-100),transparent_24%),linear-gradient(135deg,var(--fern-100),var(--paper)_44%,var(--clay)_140%)] sm:h-52">
      {src ? (
        <SmartImage
          src={src}
          alt={`Copertina di ${name}`}
          width={1200}
          height={360}
          priority
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0">
          <div className="absolute left-8 top-8 h-24 w-24 rounded-full border border-charcoal/10" />
          <div className="absolute bottom-8 right-12 grid h-24 w-36 grid-cols-6 gap-2 opacity-45">
            {Array.from({ length: 24 }).map((_, index) => (
              <span key={index} className="rounded-full bg-charcoal/10" />
            ))}
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-fern-700 via-clay to-rose-900/55" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal/28 via-charcoal/10 to-transparent" />
    </div>
  );
}
