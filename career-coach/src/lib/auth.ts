import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { readDb, updateDb } from "./store";
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

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
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
    const db = await readDb();
    const user = db.users.find((u) => u.id === userId) || null;
    if (!user) return null;
    // rollover monthly usage
    const mk = monthKey();
    if (user.usage.monthKey !== mk) {
      return updateDb((d) => {
        const u = d.users.find((x) => x.id === user.id);
        if (u) {
          u.usage = { resumeAnalyses: 0, mockInterviews: 0, monthKey: mk };
        }
        return u || user;
      });
    }
    return user;
  } catch {
    return null;
  }
}

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan as Plan,
    college: user.college || "",
    targetRole: user.targetRole || "",
    usage: user.usage,
    createdAt: user.createdAt,
  };
}
