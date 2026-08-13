type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Pathly <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email:dev]", input.subject, "→", input.to, "\n", input.text);
      return { ok: true };
    }
    return { ok: false, error: "Email is not configured on this server." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body || "Email send failed" };
  }

  return { ok: true };
}

export function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
