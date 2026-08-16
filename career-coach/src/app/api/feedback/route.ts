import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { feedbackRepo } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  section: z.string().min(1).max(80),
  type: z.enum(["issue", "suggestion", "remark"]),
  message: z.string().min(5).max(4000),
  rating: z.number().int().min(1).max(5),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const user = await getSessionUser();

    const entry = await feedbackRepo.create({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      userId: user?.id,
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      section: body.section,
      type: body.type,
      message: body.message.trim(),
      rating: body.rating,
    });

    return NextResponse.json({ ok: true, id: entry.id });
  } catch {
    return NextResponse.json({ error: "Could not save feedback" }, { status: 400 });
  }
}
