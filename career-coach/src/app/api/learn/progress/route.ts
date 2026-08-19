import { NextResponse } from "next/server";
import { z } from "zod";
import { assertFeatureAccess } from "@/lib/guard";
import { normalizeCompleted } from "@/lib/learn/merge";
import { progressRepo } from "@/lib/db";

const patchSchema = z.object({
  completed: z.array(z.string().min(1).max(120)),
});

function toClientProgress(row: { learnCompleted: string[]; updatedAt: string }) {
  return {
    completed: row.learnCompleted,
    updatedAt: row.updatedAt,
  };
}

export async function GET() {
  const gate = await assertFeatureAccess();
  if (gate.error) return gate.error;

  try {
    const row = await progressRepo.getByUserId(gate.user!.id);
    return NextResponse.json({ progress: toClientProgress(row) });
  } catch {
    return NextResponse.json({ error: "Could not load learn progress" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const gate = await assertFeatureAccess();
  if (gate.error) return gate.error;

  try {
    const body = patchSchema.parse(await req.json());
    const completed = normalizeCompleted(body.completed);
    const row = await progressRepo.upsertLearnCompleted(
      gate.user!.id,
      completed,
      new Date().toISOString(),
    );
    return NextResponse.json({ progress: toClientProgress(row) });
  } catch {
    return NextResponse.json({ error: "Could not save learn progress" }, { status: 400 });
  }
}
