/**
 * Helpers for querying Mailpit (Supabase's local mail catcher at port 56324).
 * Allows e2e tests to inspect real confirmation and password-reset emails sent by GoTrue.
 */
const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:56324";

export interface CapturedEmail {
  id: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  link: string;
}

export async function clearMailbox(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });
}

export async function getLatestEmail(recipientEmail: string, timeoutMs = 15000): Promise<CapturedEmail> {
  const start = Date.now();
  const normalizedTarget = recipientEmail.toLowerCase().trim();

  while (Date.now() - start < timeoutMs) {
    const listRes = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    if (listRes.ok) {
      const data = (await listRes.json()) as {
        messages?: Array<{
          ID: string;
          To?: Array<{ Address: string }>;
          Subject: string;
        }>;
      };

      const match = data.messages?.find((m) =>
        m.To?.some((t) => t.Address.toLowerCase().trim() === normalizedTarget),
      );

      if (match) {
        const msgRes = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
        if (msgRes.ok) {
          const body = (await msgRes.json()) as { Text?: string; HTML?: string };
          const text = body.Text ?? "";
          const html = body.HTML ?? "";
          // Extract link from text or HTML (http://127.0.0.1:56321/auth/v1/verify?...)
          const linkMatch =
            text.match(/https?:\/\/[^\s\)\"\']+/i) ??
            html.match(/href=["'](https?:\/\/[^"']+)["']/i);
          const link = (linkMatch?.[1] ?? linkMatch?.[0] ?? "").replace(/&amp;/g, "&");

          return {
            id: match.ID,
            to: recipientEmail,
            subject: match.Subject,
            text,
            html,
            link,
          };
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Timeout waiting for email sent to ${recipientEmail} after ${timeoutMs}ms`);
}
