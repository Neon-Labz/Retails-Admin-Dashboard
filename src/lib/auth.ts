import "server-only";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/db";
import { User, Session } from "@/db/schema";

export const SESSION_COOKIE = "session_token";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "customer" | "admin";
  emailVerified: boolean;
  createdAt: Date;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string, userAgent?: string | null) {
  await connectDB();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await Session.create({ userId, token, userAgent: userAgent ?? null, expiresAt });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function destroySessionByToken(token: string) {
  await connectDB();
  await Session.deleteOne({ token });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await connectDB();
  const session = await Session.findOne({ token }).lean();
  if (!session) return null;

  if ((session.expiresAt as Date).getTime() < Date.now()) {
    await Session.deleteOne({ token });
    return null;
  }

  const user = await User.findById(session.userId).lean() as any;
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Authentication required", 401);
  return user;
}

export async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.emailVerified) throw new AuthError("Please verify your email address first", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
