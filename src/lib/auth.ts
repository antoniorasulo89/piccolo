import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { queryOne, type PublicUser } from "./db";

const cookieName = "token";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
};

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
  }

  return new TextEncoder().encode(secret);
}

export function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isEmailAdmin(email: string) {
  return adminEmails().has(email.toLowerCase());
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    const id = Number(payload.sub);

    if (!Number.isInteger(id) || !payload.name || !payload.email) {
      return null;
    }

    return {
      id,
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const session = await getSessionUser();
  if (!session) return null;

  const user = await queryOne<PublicUser>(
    "SELECT id, name, email, role, bio, avatar_url, cover_url, onboarded_at, suspended_at, privacy_show_email, privacy_discoverable, theme_preference, notify_likes, notify_comments, notify_follows, created_at, created_at >= datetime('now', '-7 days') AS is_new FROM users WHERE id = ?",
    [session.id],
  );

  if (user?.suspended_at) return null;

  return user ?? null;
});

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  const store = await cookies();

  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
