import { SmartImage } from "./SmartImage";

type UserAvatarProps = {
  user: {
    name: string;
    avatar_url?: string | null;
  };
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
};

const avatarPalettes = [
  "bg-fern-100 text-fern-900 ring-fern-900/10",
  "bg-clay-100 text-clay-900 ring-clay/25",
  "bg-charcoal text-paper ring-charcoal/10",
];

function paletteFor(name: string) {
  const index = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarPalettes[index % avatarPalettes.length];
}

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (user.avatar_url) {
    return (
      <SmartImage
        src={user.avatar_url}
        alt={`Avatar di ${user.name}`}
        width={size === "lg" ? 80 : 40}
        height={size === "lg" ? 80 : 40}
        className={`${sizes[size]} rounded-full object-cover ring-4 ring-paper shadow-[0_16px_34px_-24px_oklch(22%_0.018_160)]`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold ring-1 ${paletteFor(user.name)}`}
      aria-hidden="true"
    >
      <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-paper/35" />
      <span className="absolute -bottom-2 left-1 h-5 w-8 rotate-[-24deg] rounded-full bg-clay/28" />
      <span className="relative">{initials}</span>
    </div>
  );
}
