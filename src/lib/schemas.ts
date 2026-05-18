import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(8).max(128);
export const shortTextSchema = z.string().trim().min(1);

export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = authSchema.extend({
  name: z.string().trim().min(2).max(60),
});

export const postSchema = z.object({
  content: z.string().trim().min(1).max(280),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(500),
});

export const messageSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export const reportSchema = z.object({
  reason: z.string().trim().max(180).optional().default("Contenuto da rivedere"),
  category: z.enum(["spam", "abuse", "privacy", "other"]).optional().default("other"),
});

export const groupSchema = z.object({
  name: z.string().trim().min(3).max(60),
  description: z.string().trim().max(220).optional().default(""),
  privacy: z.enum(["public", "private"]).optional().default("public"),
});

export const conversationSchema = z.object({
  memberIds: z.array(z.coerce.number().int().positive()).min(1).max(12),
  title: z.string().trim().max(80).optional().default(""),
});

export const privacySchema = z.object({
  privacy_show_email: z.boolean().optional().default(false),
  privacy_discoverable: z.boolean().optional().default(true),
});

export const themeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional().default("system"),
});

const imageDataSchema = z
  .string()
  .trim()
  .max(900_000)
  .refine(
    (value) => !value || /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,/.test(value),
    "Il file deve essere una immagine valida.",
  )
  .optional()
  .default("");

const httpsUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        ["images.unsplash.com", "avatars.githubusercontent.com", "lh3.googleusercontent.com", "res.cloudinary.com"].includes(url.hostname)
      );
    } catch {
      return false;
    }
  }, "Usa un URL HTTPS valido da un dominio immagini consentito, oppure carica un file.")
  .optional()
  .default("");

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Il nome deve contenere almeno 2 caratteri.").max(48),
  bio: z.string().trim().max(160).optional().default(""),
  avatar_url: httpsUrlSchema,
  avatar_data: imageDataSchema,
  cover_url: httpsUrlSchema,
  cover_data: imageDataSchema,
});

export const onboardingSchema = z.object({
  bio: z.string().trim().max(160).optional().default(""),
});

export const notificationPreferencesSchema = z.object({
  notify_likes: z.boolean().optional().default(true),
  notify_comments: z.boolean().optional().default(true),
  notify_follows: z.boolean().optional().default(true),
  notify_group_posts: z.boolean().optional().default(true),
});

export const groupRequestResolutionSchema = z.object({
  status: z.enum(["approved", "rejected"]).optional().default("approved"),
});

export const createInviteSchema = z.object({
  max_uses: z.number().int().min(1).max(1000).optional(),
  expires_in_hours: z.number().int().min(1).max(720).optional(),
});

export const createMemberInviteSchema = z.object({
  userId: z.number().int().positive(),
  expires_in_hours: z.number().int().min(1).max(720).optional(),
});

export const memberInviteResponseSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

export const adminRoleSchema = z.object({
  role: z.enum(["admin", "user"]),
});

export const suspensionSchema = z.object({
  suspended: z.boolean().optional().default(false),
});

export const reportResolutionSchema = z.object({
  status: z.enum(["resolved", "dismissed"]).optional().default("resolved"),
  note: z.string().trim().max(240).optional().default(""),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: passwordSchema,
});
