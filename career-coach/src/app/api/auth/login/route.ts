import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, publicUser, verifyPassword } from "@/lib/auth";
import { readDb } from "@/lib/store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const db = await readDb();
    const user = db.users.find((u) => u.email === body.email.toLowerCase().trim());
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 400 });
  }
}
