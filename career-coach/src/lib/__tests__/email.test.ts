import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { sendEmail } from "@/lib/email";

const input = {
  to: "student@example.test",
  subject: "Reset",
  html: "<p>hi</p>",
  text: "hi",
};

const ok = () => new Response("{}", { status: 200 });
const fail = (status = 500) => new Response("provider error", { status });

const BREVO = "https://api.brevo.com/v3/smtp/email";
const RESEND = "https://api.resend.com/emails";

let fetchMock: ReturnType<typeof vi.fn>;

function env(vars: Record<string, string>) {
  for (const key of [
    "EMAIL_PROVIDER",
    "BREVO_API_KEY",
    "BREVO_SENDER_EMAIL",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "GMAIL_USER",
    "GMAIL_APP_PASSWORD",
  ]) {
    vi.stubEnv(key, "");
  }
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
}

const calledUrls = () => fetchMock.mock.calls.map((c) => String(c[0]));

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NODE_ENV", "production");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendEmail providers", () => {
  it("sends through Brevo when configured", async () => {
    env({ BREVO_API_KEY: "test-brevo-key", BREVO_SENDER_EMAIL: "sender@example.test" });
    fetchMock.mockResolvedValue(ok());

    const result = await sendEmail(input);

    expect(result).toEqual({ ok: true });
    expect(calledUrls()).toEqual([BREVO]);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["api-key"]).toBe("test-brevo-key");
    expect(JSON.parse(init.body)).toMatchObject({
      sender: { email: "sender@example.test" },
      to: [{ email: "student@example.test" }],
      subject: "Reset",
    });
  });

  it("uses Resend when Brevo is not configured", async () => {
    env({ RESEND_API_KEY: "test-resend-key", EMAIL_FROM: "App <from@example.test>" });
    fetchMock.mockResolvedValue(ok());

    const result = await sendEmail(input);

    expect(result).toEqual({ ok: true });
    expect(calledUrls()).toEqual([RESEND]);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer test-resend-key");
    expect(JSON.parse(init.body)).toMatchObject({
      from: "App <from@example.test>",
      to: ["student@example.test"],
    });
  });

  it("falls back to Resend when Brevo returns an error", async () => {
    env({
      BREVO_API_KEY: "test-brevo-key",
      BREVO_SENDER_EMAIL: "sender@example.test",
      RESEND_API_KEY: "test-resend-key",
    });
    fetchMock.mockResolvedValueOnce(fail(500)).mockResolvedValueOnce(ok());

    const result = await sendEmail(input);

    expect(result).toEqual({ ok: true });
    expect(calledUrls()).toEqual([BREVO, RESEND]);
  });

  it("honours EMAIL_PROVIDER=resend as the first choice, then Brevo", async () => {
    env({
      EMAIL_PROVIDER: "resend",
      BREVO_API_KEY: "test-brevo-key",
      BREVO_SENDER_EMAIL: "sender@example.test",
      RESEND_API_KEY: "test-resend-key",
    });
    fetchMock.mockResolvedValueOnce(fail(500)).mockResolvedValueOnce(ok());

    expect(await sendEmail(input)).toEqual({ ok: true });
    expect(calledUrls()).toEqual([RESEND, BREVO]);
  });

  it("returns the failure result when every provider fails", async () => {
    env({
      BREVO_API_KEY: "test-brevo-key",
      BREVO_SENDER_EMAIL: "sender@example.test",
      RESEND_API_KEY: "test-resend-key",
    });
    fetchMock.mockImplementation(async () => fail(503));

    const result = await sendEmail(input);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Brevo/);
    expect(result.error).toMatch(/Resend/);
    expect(calledUrls()).toEqual([BREVO, RESEND]);
  });

  it("returns the failure result when no provider is configured", async () => {
    env({});

    const result = await sendEmail(input);

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("no Gmail/Nodemailer fallback", () => {
  it("ignores GMAIL_* variables and fails instead of using SMTP", async () => {
    env({ GMAIL_USER: "someone@example.test", GMAIL_APP_PASSWORD: "app-password-test" });

    const result = await sendEmail(input);

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats EMAIL_PROVIDER=gmail as unknown and still uses Brevo", async () => {
    env({
      EMAIL_PROVIDER: "gmail",
      BREVO_API_KEY: "test-brevo-key",
      BREVO_SENDER_EMAIL: "sender@example.test",
    });
    fetchMock.mockResolvedValue(ok());

    expect(await sendEmail(input)).toEqual({ ok: true });
    expect(calledUrls()).toEqual([BREVO]);
  });

  it("has no nodemailer or Gmail code or dependency left", () => {
    const root = process.cwd();
    const source = readFileSync(path.join(root, "src/lib/email.ts"), "utf8");
    expect(source).not.toMatch(/nodemailer/i);
    expect(source).not.toMatch(/gmail/i);

    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps).filter((n) => /nodemailer/i.test(n))).toEqual([]);
  });
});
