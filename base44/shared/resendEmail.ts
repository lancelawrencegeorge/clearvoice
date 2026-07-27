import { secrets } from "base44:runtime";

/**
 * Sends an email via Resend from no-reply@clearvoice.africa.
 * Returns { success: true } on 200, otherwise throws.
 */
export async function sendEmail({ to, subject, body, fromName = "ClearVoice" }) {
  const apiKey = secrets.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY not set");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <no-reply@clearvoice.africa>`,
      to,
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${errText}`);
  }

  return { success: true };
}