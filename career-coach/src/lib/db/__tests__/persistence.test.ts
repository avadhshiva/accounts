import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth";
import {
  closePool,
  feedbackRepo,
  interviewRepo,
  passwordResetRepo,
  resumeRepo,
  runMigrations,
  userRepo,
} from "@/lib/db";
import { interviewRepoJson } from "@/lib/db/json/interviews";
import { userRepoJson } from "@/lib/db/json/users";

const hasPg = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasPg)("PostgreSQL persistence", () => {
  const userA = randomUUID();
  const userB = randomUUID();
  const emailA = `test-a-${Date.now()}@pathly.test`;
  const emailB = `test-b-${Date.now()}@pathly.test`;

  beforeAll(async () => {
    await runMigrations();
    const now = new Date().toISOString();
    const mk = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
    const hash = await hashPassword("TestPass1!");

    await userRepo.create({
      id: userA,
      name: "Test A",
      email: emailA,
      passwordHash: hash,
      plan: "pro",
      access: "trial",
      trialStartedAt: "",
      sessionVersion: 1,
      college: "Test College",
      targetRole: "Software Engineer",
      createdAt: now,
      updatedAt: now,
      usage: { resumeAnalyses: 0, mockInterviews: 0, monthKey: mk },
    });

    await userRepo.create({
      id: userB,
      name: "Test B",
      email: emailB,
      passwordHash: hash,
      plan: "pro",
      access: "trial",
      trialStartedAt: "",
      sessionVersion: 1,
      createdAt: now,
      updatedAt: now,
      usage: { resumeAnalyses: 0, mockInterviews: 0, monthKey: mk },
    });
  });

  afterAll(async () => {
    await closePool();
  });

  it("creates and finds user by email", async () => {
    const found = await userRepo.findByEmail(emailA);
    expect(found?.id).toBe(userA);
    expect(found?.college).toBe("Test College");
  });

  it("authenticates user lookup by id", async () => {
    const found = await userRepo.findById(userA);
    expect(found?.email).toBe(emailA);
  });

  it("persists resume analysis for user", async () => {
    const resumeId = randomUUID();
    await resumeRepo.create({
      id: resumeId,
      userId: userA,
      createdAt: new Date().toISOString(),
      role: "SDE",
      score: 75,
      summary: "Test summary",
      strengths: ["a"],
      gaps: ["b"],
      rewrites: [],
      keywordsToAdd: ["c"],
    });
    const list = await resumeRepo.listByUserId(userA, 10);
    expect(list.some((r: { id: string }) => r.id === resumeId)).toBe(true);
  });

  it("isolates resume data between users", async () => {
    const listB = await resumeRepo.listByUserId(userB, 10);
    expect(listB.length).toBe(0);
  });

  it("persists interview session with user isolation", async () => {
    const sessionId = randomUUID();
    await interviewRepo.create({
      id: sessionId,
      userId: userA,
      mode: "hr",
      createdAt: new Date().toISOString(),
      status: "active",
      messages: [{ role: "coach", content: "Hi", at: new Date().toISOString() }],
    });
    expect(await interviewRepo.findByIdForUser(sessionId, userA)).not.toBeNull();
    expect(await interviewRepo.findByIdForUser(sessionId, userB)).toBeNull();
  });

  it("persists trial start", async () => {
    const started = await userRepo.startTrial(userA);
    expect(started?.trialStartedAt).toBeTruthy();
  });

  it("persists usage counters", async () => {
    const updated = await userRepo.incrementUsage(userA, "resumeAnalyses");
    expect(updated?.usage.resumeAnalyses).toBeGreaterThanOrEqual(1);
  });

  it("persists password reset token", async () => {
    const token = randomUUID().replace(/-/g, "");
    const expires = new Date(Date.now() + 3600000).toISOString();
    await passwordResetRepo.createToken({
      token,
      userId: userA,
      email: emailA,
      expiresAt: expires,
      createdAt: new Date().toISOString(),
    });
    const found = await passwordResetRepo.findValidToken(token);
    expect(found?.userId).toBe(userA);
  });

  it("persists feedback", async () => {
    const id = randomUUID();
    await feedbackRepo.create({
      id,
      createdAt: new Date().toISOString(),
      userId: userA,
      name: "Test A",
      email: emailA,
      section: "Dashboard",
      type: "suggestion",
      message: "Great app",
      rating: 5,
    });
    expect(id).toBeTruthy();
  });
});

describe("JSON dev storage isolation", () => {
  const originalDb = process.env.DATABASE_URL;
  const originalBackend = process.env.STORAGE_BACKEND;

  beforeAll(() => {
    delete process.env.DATABASE_URL;
    process.env.STORAGE_BACKEND = "json";
  });

  afterAll(() => {
    if (originalDb) process.env.DATABASE_URL = originalDb;
    else delete process.env.DATABASE_URL;
    if (originalBackend) process.env.STORAGE_BACKEND = originalBackend;
    else delete process.env.STORAGE_BACKEND;
  });

  it("isolates interviews by userId in JSON mode", async () => {
    const uid = randomUUID();
    const other = randomUUID();
    const now = new Date().toISOString();
    const mk = "2099-01";
    const hash = await hashPassword("TestPass1!");

    await userRepoJson.create({
      id: uid,
      name: "J",
      email: `j-${Date.now()}@test.local`,
      passwordHash: hash,
      plan: "free",
      access: "trial",
      trialStartedAt: "",
      sessionVersion: 1,
      createdAt: now,
      usage: { resumeAnalyses: 0, mockInterviews: 0, monthKey: mk },
    });

    const sid = randomUUID();
    await interviewRepoJson.create({
      id: sid,
      userId: uid,
      mode: "technical",
      createdAt: now,
      status: "active",
      messages: [],
    });

    expect(await interviewRepoJson.findByIdForUser(sid, uid)).not.toBeNull();
    expect(await interviewRepoJson.findByIdForUser(sid, other)).toBeNull();
  });
});
