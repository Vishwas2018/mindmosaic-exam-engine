/** Shared mail.tm throwaway-inbox helpers for hosted real-email specs. */
import { expect, HOSTED_URL, RUN_ID } from "./fixtures";

const MAILTM = "https://api.mail.tm";

export type Inbox = { address: string; token: string };
export type Mail = { id: string; from: string; subject: string; receivedAt: string; html: string; text: string };

export async function mailtm(pathname: string, init: RequestInit = {}, token?: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(`${MAILTM}${pathname}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
    if (r.status === 429) {
      await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
      continue;
    }
    if (!r.ok) throw new Error(`mail.tm ${pathname} -> ${r.status}`);
    return r.status === 204 ? null : r.json();
  }
  throw new Error(`mail.tm ${pathname} rate-limited`);
}

export async function createInbox(label: string): Promise<Inbox> {
  const domains = await mailtm("/domains");
  const domain = domains["hydra:member"].find((d: { isActive: boolean }) => d.isActive).domain;
  const address = `mmaccept-${RUN_ID}-${label}@${domain}`;
  const password = `Inbox-${RUN_ID}-${label}-pw`;
  await mailtm("/accounts", { method: "POST", body: JSON.stringify({ address, password }) });
  const { token } = await mailtm("/token", { method: "POST", body: JSON.stringify({ address, password }) });
  return { address, token };
}

/** Waits for a new message whose subject matches, ignoring ids already seen. */
export async function waitForMail(inbox: Inbox, subject: RegExp, seen: Set<string>, timeoutMs = 5 * 60_000): Promise<Mail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const list = await mailtm("/messages", {}, inbox.token);
    for (const m of list["hydra:member"]) {
      if (seen.has(m.id) || !subject.test(m.subject)) continue;
      seen.add(m.id);
      const full = await mailtm(`/messages/${m.id}`, {}, inbox.token);
      return {
        id: m.id,
        from: full.from?.address ?? "",
        subject: full.subject,
        receivedAt: full.createdAt,
        html: (full.html ?? []).join("\n"),
        text: full.text ?? "",
      };
    }
    await new Promise((res) => setTimeout(res, 5000));
  }
  throw new Error(`no email matching ${subject} reached ${inbox.address} within ${timeoutMs / 1000}s`);
}

/** The action link in a Supabase auth email (confirmation or recovery), &amp; decoded. */
export function actionLink(mail: Mail): string {
  const hrefs = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const fromText = [...mail.text.matchAll(/https?:\/\/\S+/g)].map((m) => m[0].replace(/[)\]>.,]+$/, ""));
  const link = [...hrefs, ...fromText].find((h) => /token_hash=|\/auth\/v1\/verify|[?&]token=/.test(h));
  if (!link) throw new Error(`no action link in "${mail.subject}"`);
  return link;
}

export function checkLinkTarget(link: string) {
  const u = new URL(link);
  expect(u.host, "link points at DEV Supabase or this Preview").toMatch(
    /^(mfglzabnayacssgertat\.supabase\.co|[a-z0-9-]+\.vercel\.app)$/,
  );
  const redirectTo = u.searchParams.get("redirect_to");
  if (redirectTo) expect(new URL(redirectTo).origin, "redirect stays on this Preview").toBe(new URL(HOSTED_URL).origin);
}
