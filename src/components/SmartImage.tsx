import Image from "next/image";

type SmartImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

export function SmartImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
}: SmartImageProps) {
  if (src.startsWith("data:")) {
    return (
      // Data URLs are user-uploaded profile images stored in the database.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
