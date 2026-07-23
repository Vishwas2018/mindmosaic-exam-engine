"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, LoaderCircle, UserPlus } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from "@/components/ui";

interface Credentials {
  readonly loginCode: string;
  readonly pin: string;
}

interface ProvisionChildResponse {
  readonly ok: boolean;
  readonly message?: string;
  readonly loginCode?: string;
  readonly pin?: string;
}

/**
 * The parent-facing surface for the existing provisionChild server action
 * (../../auth/provision-child.ts). Until this shipped, the action was fully
 * built and tested but unreachable from the UI, so a parent had no way to
 * create a child — and therefore no child could ever sign in. Posts to
 * /api/parent/children (src/app/api/parent/children/route.ts) rather than
 * importing the action directly: it touches the Supabase service-role key,
 * and src/tests/unit/provision-child-server-only.test.ts forbids any "use
 * client" component from importing that module, matching the same
 * Route-Handler boundary already used for Stripe checkout/portal. The
 * action returns the login code and PIN exactly once; we surface them here
 * with a clear "save these now" warning and never persist them client-side.
 */
export function AddChildCard() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [yearLevel, setYearLevel] = useState<"" | "3" | "5">("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = displayName.trim().length > 0 && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    let result: ProvisionChildResponse;
    try {
      const response = await fetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          yearLevel: yearLevel === "" ? undefined : (Number(yearLevel) as 3 | 5),
          pin: pin.trim() || undefined,
        }),
      });
      result = (await response.json().catch(() => null)) ?? { ok: false };
    } catch {
      result = { ok: false };
    }

    setSubmitting(false);

    if (result.ok && result.loginCode && result.pin) {
      setCredentials({ loginCode: result.loginCode, pin: result.pin });
      setDisplayName("");
      setYearLevel("");
      setPin("");
      return;
    }
    setError(result.message ?? "Could not add the child. Please try again.");
  }

  async function copyCredentials() {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(
        `MindMosaic login\nLogin code: ${credentials.loginCode}\nPIN: ${credentials.pin}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the codes remain on screen to copy by hand.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus aria-hidden="true" className="h-5 w-5 text-royal" />
          Add a child
        </CardTitle>
        <CardDescription>
          Create a login for your child. You&apos;ll get a login code and PIN to
          give them &mdash; they never need an email address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {credentials ? (
          <div
            role="status"
            className="rounded-xl border border-success/30 bg-success/10 p-5"
          >
            <p className="text-sm font-bold text-ink">
              Account created. These are shown once &mdash; save them now and give
              them to your child.
            </p>
            <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-base">
              <dt className="font-semibold text-muted">Login code</dt>
              <dd className="font-black tracking-wide text-ink">
                {credentials.loginCode}
              </dd>
              <dt className="font-semibold text-muted">PIN</dt>
              <dd className="font-black tracking-wide text-ink">
                {credentials.pin}
              </dd>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={copyCredentials}>
                {copied ? (
                  <Check aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Copy aria-hidden="true" className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCredentials(null);
                  setCopied(false);
                }}
              >
                Add another child
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={() => router.refresh()}>
                Done &mdash; show on dashboard
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error"
              >
                {error}
              </p>
            )}
            <Input
              id="add-child-name"
              label="Child's name"
              autoComplete="off"
              value={displayName}
              onChange={(e) => setDisplayName(e.currentTarget.value)}
            />
            <Select
              id="add-child-year"
              label="Year level (optional)"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.currentTarget.value as "" | "3" | "5")}
            >
              <option value="">Not sure yet</option>
              <option value="3">Grade 3</option>
              <option value="5">Grade 5</option>
            </Select>
            <Input
              id="add-child-pin"
              label="PIN (optional)"
              inputMode="numeric"
              autoComplete="off"
              hint="4-6 digits. Leave blank and we'll generate one for you."
              value={pin}
              onChange={(e) => setPin(e.currentTarget.value)}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!canSubmit}
              className="mt-1 w-full sm:w-auto sm:self-start"
            >
              {submitting && (
                <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
              )}
              Create login
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
