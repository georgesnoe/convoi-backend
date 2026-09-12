import type { H3Event } from "nitro";
import { deleteCookie, getCookie, getRequestIP, setCookie } from "nitro/h3";
import { hashSync, compareSync } from "bcrypt";
import { env } from "./env";
import { randomBytes } from "crypto";
import { db } from "./db/config";
import { sessions } from "./db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE_NAME = env.SESSION_COOKIE_NAME;
const SESSION_DURATION_MS = env.SESSION_DURATION_MS;
const SALT_ROUNDS = env.SALT_ROUNDS;

export function hashPassword(password: string): string {
  return hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, stored: string): boolean {
  return compareSync(password, stored);
}

export async function createSession(event: H3Event, userId: string) {
  const token = randomBytes(64).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
    ipAddress: getRequestIP(event) ?? null,
    userAgent: event.req.headers.get("user-agent") ?? null,
  });

  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return { token, expiresAt };
}

export async function getSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE_NAME);
  if (!token) return null;

  const session = await db.query.sessions.findFirst({
    where: { token },
    with: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }

  return session;
}

export async function deleteSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE_NAME);
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  deleteCookie(event, SESSION_COOKIE_NAME, { path: "/" });
}
