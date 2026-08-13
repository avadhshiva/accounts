import nodemailer from "nodemailer";

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
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Pathly";
  const gmailUser = process.env.GMAIL_USER?.trim();
  if (gmailUser) return `${appName} <${gmailUser}>`;
  return process.env.EMAIL_FROM || `${appName} <onboarding@resend.dev>`;
}

async function sendViaGmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) return { ok: false, error: "Gmail SMTP not configured" };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
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

/** Pilot-friendly: Gmail SMTP (free, no domain) → Resend → dev console log */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const hasGmail = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const prefer = (process.env.EMAIL_PROVIDER || "gmail").toLowerCase();

  const order =
    prefer === "resend"
      ? ([sendViaResend, sendViaGmail] as const)
      : ([sendViaGmail, sendViaResend] as const);

  for (const sender of order) {
    const result = await sender(input);
    if (result.ok) return result;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[email:dev]", input.subject, "→", input.to, "\n", input.text);
    return { ok: true };
  }

  if (hasGmail || hasResend) {
    return {
      ok: false,
      error: "Could not send email. Check Gmail App Password or Resend settings.",
    };
  }

  return {
    ok: false,
    error:
      "Email is not configured. Add GMAIL_USER + GMAIL_APP_PASSWORD on Render (free pilot), or set up Resend later.",
  };
}
