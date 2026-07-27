import { secrets } from "base44:runtime";

/**
 * Sends an email via SendGrid from no-reply@clearvoice.africa.
 * Returns { success: true } on 202, otherwise throws.
 */
export async function sendEmail({ to, subject, body, fromName = "ClearVoice" }) {
  const apiKey = secrets.get("SENDGRID_API_KEY");
  if (!apiKey) throw new Error("SENDGRID_API_KEY not set");

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { email: "no-reply@clearvoice.africa", name: fromName },
      personalizations: [{ to: [{ email: to }] }],
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`SendGrid error ${res.status}: ${errText}`);
  }

  return { success: true };
}