import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ensureUserDefaults } from "./access";
import { userRepo } from "./db";
import { Plan, User } from "./types";

const COOKIE = "pathly_session";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "dev-secret-only";
  return new TextEncoder().encode(secret);
}

export function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, sessionVersion: number) {
  const token = await new SignJWT({ sub: userId, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = payload.sub;
    if (!userId) return null;
    let user = await userRepo.findById(userId);
    if (!user) return null;
    user = ensureUserDefaults(user);

    const tokenSv = typeof payload.sv === "number" ? payload.sv : 1;
    if (tokenSv !== user.sessionVersion) {
      return null;
    }

    const mk = monthKey();
    if (user.usage.monthKey !== mk) {
      user = await userRepo.resetMonthlyUsage(user.id, mk);
    }
    return user;
  } catch {
    return null;
  }
}

export function publicUser(user: User) {
  const u = ensureUserDefaults(user);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    plan: u.plan as Plan,
    access: u.access,
    trialStartedAt: u.trialStartedAt,
    paidAt: u.paidAt || null,
    college: u.college || "",
    targetRole: u.targetRole || "",
    usage: u.usage,
    createdAt: u.createdAt,
  };
}
