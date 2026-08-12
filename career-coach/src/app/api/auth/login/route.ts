import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, publicUser, verifyPassword } from "@/lib/auth";
import { ensureUserDefaults, getAccessSnapshot } from "@/lib/access";
import { updateDb } from "@/lib/store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const user = await updateDb(async (db) => {
      const found = db.users.find((u) => u.email === email);
      if (!found) throw new Error("INVALID");
      const ok = await verifyPassword(body.password, found.passwordHash);
      if (!ok) throw new Error("INVALID");
      ensureUserDefaults(found);
      // Single active login: bump session version so older devices are logged out
      found.sessionVersion = (found.sessionVersion || 1) + 1;
      return found;
    });

    await createSession(user.id, user.sessionVersion);
    return NextResponse.json({
      user: publicUser(user),
      access: getAccessSnapshot(user),
      notice: "Logged in here only — any older session was signed out.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
}
