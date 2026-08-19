import nodemailer from "nodemailer";
import { APP_NAME } from "./brand";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function defaultFrom() {
  const brevoSender = process.env.BREVO_SENDER_EMAIL?.trim();
  if (brevoSender) return `${APP_NAME} <${brevoSender}>`;
  const gmailUser = process.env.GMAIL_USER?.trim();
  if (gmailUser) return `${APP_NAME} <${gmailUser}>`;
  return process.env.EMAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`;
}

/** Brevo (Sendinblue) — HTTP API, works on Render free tier. Verify sender email in Brevo dashboard (no domain purchase). */
async function sendViaBrevo(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!apiKey || !senderEmail) return { ok: false, error: "Brevo not configured" };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: APP_NAME, email: senderEmail },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body || "Brevo send failed" };
  }
  return { ok: true };
}

async function sendViaResend(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Resend not configured" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || defaultFrom(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body || "Resend send failed" };
  }
  return { ok: true };
}

/** Gmail SMTP — works locally and on paid Render; blocked on Render free tier (ports 587/465). */
async function sendViaGmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) return { ok: false, error: "Gmail SMTP not configured" };

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  try {
    await transporter.sendMail({
      from: defaultFrom(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gmail send failed";
    return { ok: false, error: message };
  }
}

/**
 * Email providers (Render free tier: use brevo or resend — NOT gmail SMTP).
 * Priority follows EMAIL_PROVIDER, then sensible fallbacks.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const prefer = (process.env.EMAIL_PROVIDER || "brevo").toLowerCase();

  const senders: Record<string, () => Promise<{ ok: boolean; error?: string }>> = {
    brevo: () => sendViaBrevo(input),
    resend: () => sendViaResend(input),
    gmail: () => sendViaGmail(input),
  };

  const order = [prefer, "brevo", "resend", "gmail"].filter(
    (name, i, arr) => arr.indexOf(name) === i,
  );

  const errors: string[] = [];
  for (const name of order) {
    const sender = senders[name];
    if (!sender) continue;
    const result = await sender();
    if (result.ok) return result;
    if (result.error) errors.push(`${name}: ${result.error}`);
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[email:dev]", input.subject, "→", input.to, "\n", input.text);
    return { ok: true };
  }

  console.error("[email] all providers failed:", errors.join(" | "));
  return {
    ok: false,
    error:
      "Could not send email. On Render free tier use Brevo (BREVO_API_KEY + BREVO_SENDER_EMAIL). Gmail SMTP is blocked on Render free.",
  };
}
