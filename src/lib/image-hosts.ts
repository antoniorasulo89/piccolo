export const ALLOWED_IMAGE_HOSTS = [
  "images.unsplash.com",
  "avatars.githubusercontent.com",
  "lh3.googleusercontent.com",
  "res.cloudinary.com",
] as const;

export function isAllowedImageHost(hostname: string) {
  return ALLOWED_IMAGE_HOSTS.includes(hostname as (typeof ALLOWED_IMAGE_HOSTS)[number]);
}
