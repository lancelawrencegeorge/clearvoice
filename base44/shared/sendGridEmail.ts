/**
 * Sends an email via SendGrid from no-reply@clearvoice.africa.
 * The API key is passed by the calling backend function (which reads it
 * from base44:runtime secrets) — this shared module must not import
 * "base44:runtime" directly or Vite's dev-server will fail to resolve it.
 */
export async function sendEmail({ to, subject, body, fromName = "ClearVoice", apiKey }) {
  if (!apiKey) throw new Error("SendGrid API key not provided");

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