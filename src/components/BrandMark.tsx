import Link from "next/link";
import Image from "next/image";

type BrandMarkProps = {
  href: string;
  compact?: boolean;
};

export function BrandMark({ href, compact = false }: BrandMarkProps) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-surface shadow-[0_18px_40px_-28px_oklch(22%_0.018_160)] ring-1 ring-charcoal/10 transition duration-300 group-hover:-translate-y-0.5 group-hover:ring-fern-900/20">
        <Image
          src="/brand/piccolo-icon.webp"
          alt=""
          width={36}
          height={36}
          priority
          className="h-full w-full object-cover"
        />
      </span>
      <span className={compact ? "sr-only" : "grid leading-none"}>
        <span className="text-[1.05rem] font-semibold tracking-tight text-charcoal">
          Piccolo
        </span>
        <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-charcoal/45">
          short social
        </span>
      </span>
    </Link>
  );
}
