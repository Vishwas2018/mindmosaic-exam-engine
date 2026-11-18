"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { PrintSignInCardDialog } from "./PrintSignInCardDialog";
import { Card, InfoNote, SectionTitle, pButtonPrimary, pButtonQuiet, pButtonSecondary, pFocus } from "./parent-ui";

/**
 * "Add your first child" → "{Name} is ready" (Claude Design parent artboards 01–03, and the add-child panel on
 * Children). Creates a real child login through POST /api/parent/children. The PIN is shown once, after the
 * server confirms it; only a scrambled copy is kept, so the way back from a lost PIN is a reset, not a lookup.
 *
 * A name this parent already uses is a question, not a failure (the API answers `duplicate`), so the form keeps
 * what was typed and asks.
 */

interface ProvisionChildResponse {
  readonly ok: boolean;
  readonly message?: string;
  readonly duplicate?: boolean;
  readonly loginCode?: string;
  readonly pin?: string;
}

const field =
  "min-h-12 w-full rounded-xl border border-[#8a8394] bg-white px-3.5 text-base text-mm-ink placeholder:text-mm-muted focus:border-mm-brand focus:outline-none focus:ring-[6px] focus:ring-mm-brand/15";

export function AddChildFlow({
  availableYearLevels,
  heading = "Add your first child",
  lead = "You can change any of this later.",
  laterHref = "/parent",
  onDoneHref = "/parent",
  rail,
}: {
  /** Shown beside the form (not beside the "ready" screen, which has its own). */
  rail?: ReactNode;
  availableYearLevels: readonly number[];
  heading?: string;
  lead?: string;
  /** "I'll do this later" target; omit the link by passing null. */
  laterHref?: string | null;
  onDoneHref?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [year, setYear] = useState<string>(availableYearLevels.length === 1 ? String(availableYearLevels[0]) : "");
  const [pinMode, setPinMode] = useState<"generate" | "choose">("generate");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; year: number | null; loginCode: string; pin: string } | null>(
    null,
  );
  const [printOpen, setPrintOpen] = useState(false);
  /* A double click must not create two children: a ref flips synchronously inside the first click's handler. */
  const inFlight = useRef(false);

  const trimmed = name.trim();
  const pinValid = pinMode === "generate" || /^\d{6}$/.test(pin);

  async function submit(allowDuplicate: boolean) {
    if (inFlight.current) return;
    if (!trimmed) {
      setError("Enter your child’s first name.");
      return;
    }
    if (!year) {
      setError("Choose a year level.");
      return;
    }
    if (!pinValid) {
      setError("A PIN is exactly 6 digits.");
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    setDuplicatePrompt(null);
    let result: ProvisionChildResponse;
    try {
      const response = await fetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: trimmed,
          yearLevel: Number(year),
          pin: pinMode === "choose" ? pin : undefined,
          allowDuplicate: allowDuplicate || undefined,
        }),
      });
      result = ((await response.json().catch(() => null)) as ProvisionChildResponse | null) ?? { ok: false };
    } catch {
      result = { ok: false };
    }
    inFlight.current = false;
    setSubmitting(false);
    if (result.ok && result.loginCode && result.pin) {
      setCreated({ name: trimmed, year: Number(year), loginCode: result.loginCode, pin: result.pin });
      router.refresh();
      return;
    }
    if (result.duplicate) {
      setDuplicatePrompt(result.message ?? "You already have a child with that name. Add another anyway?");
      return;
    }
    setError(result.message ?? "We couldn’t add the child. Nothing was created. Please try again.");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(false);
  }

  if (created) {
    const first = created.name;
    return (
      <div className="grid gap-5">
        <div role="status" className="flex gap-3 rounded-2xl bg-[#d9efec] px-5 py-4 text-[15px] text-[#0b4f49]">
          <Check aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#0b6b63]" />
          <div>
            <b className="font-semibold">{first}&rsquo;s profile is created.</b>
            <span className="mt-0.5 block">Write the sign-in details down or print them. The PIN is shown once.</span>
          </div>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Card as="section" aria-labelledby="ready-heading">
            <SectionTitle id="ready-heading">How {first} signs in</SectionTitle>
            <p className="mt-1.5 text-sm text-mm-ink-soft">
              {first} goes to the same sign-in page you use and chooses &ldquo;I&rsquo;m a student&rdquo;.
            </p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-mm-line bg-mm-tint-soft px-5 py-5 text-center">
                <dt className="text-sm text-mm-ink-soft">Login code</dt>
                <dd className="mt-2 font-mono text-[22px] font-semibold tracking-[0.12em] text-mm-ink">{created.loginCode}</dd>
                <dd className="mt-2 text-[13px] text-mm-muted">Never changes</dd>
              </div>
              <div className="rounded-2xl border border-mm-line bg-mm-tint-soft px-5 py-5 text-center">
                <dt className="text-sm text-mm-ink-soft">PIN</dt>
                <dd className="mt-2 font-mono text-[22px] font-semibold tracking-[0.3em] text-mm-ink">{created.pin}</dd>
                <dd className="mt-2 text-[13px] text-mm-muted">Shown once &middot; you can reset it</dd>
              </div>
            </dl>
            <InfoNote className="mt-3">
              We keep only a scrambled copy of the PIN, so we cannot show it to you again. If it is lost, reset it from
              {" "}{first}&rsquo;s profile &mdash; that takes a few seconds and loses nothing.
            </InfoNote>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button type="button" className={pButtonSecondary} onClick={() => setPrintOpen(true)}>
                Print a sign-in card
              </button>
            </div>
          </Card>
          <aside className="grid gap-4">
            <Card as="section" aria-labelledby="what-now">
              <SectionTitle id="what-now">What now?</SectionTitle>
              <div className="mt-4 grid gap-2.5">
                <button
                  type="button"
                  className={pButtonPrimary}
                  onClick={() => {
                    setCreated(null);
                    setName("");
                    setPin("");
                    setPinMode("generate");
                  }}
                >
                  Add another child
                </button>
                <Link href={onDoneHref} className={pButtonSecondary}>
                  Go to Family Overview
                </Link>
              </div>
            </Card>
            <Card as="section" aria-labelledby="helping-start">
              <SectionTitle id="helping-start">Helping {first} start</SectionTitle>
              <ul className="mt-3 grid gap-2.5 text-[15px] leading-[1.5] text-mm-ink-soft">
                {[
                  "Sit with them the first time so the code and PIN go in correctly.",
                  "Start with a practice set, not a timed paper.",
                  "Practice sets are not recorded — nothing they try counts against them.",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#0f6b32]" />
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
        <PrintSignInCardDialog
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          childName={created.name}
          loginCode={created.loginCode}
          yearLevel={created.year}
        />
      </div>
    );
  }

  const form = (
    <Card as="section" aria-labelledby="add-child-heading">
      <SectionTitle id="add-child-heading">{heading}</SectionTitle>
      <p className="mt-1.5 text-sm text-mm-ink-soft">{lead}</p>
      <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-5">
        <div className="grid gap-2">
          <label htmlFor="child-first-name" className="text-sm font-semibold text-mm-ink">
            First name
          </label>
          <input
            id="child-first-name"
            className={twMerge(field, pFocus)}
            autoComplete="off"
            placeholder="Aisha"
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
              setError(null);
              setDuplicatePrompt(null);
            }}
            aria-describedby="child-first-name-hint"
          />
          <p id="child-first-name-hint" className="text-[13px] text-mm-muted">
            Just a first name. This is what they see when they sign in, and it is never shown outside your family.
          </p>
        </div>

        <div className="grid gap-2">
          <label htmlFor="child-year" className="text-sm font-semibold text-mm-ink">
            Year level
          </label>
          <select
            id="child-year"
            className={twMerge(field, "appearance-auto", pFocus)}
            value={year}
            onChange={(e) => {
              setYear(e.currentTarget.value);
              setError(null);
            }}
            aria-describedby="child-year-hint"
          >
            <option value="">Choose a year</option>
            {availableYearLevels.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
          <p id="child-year-hint" className="text-[13px] text-mm-muted">
            {availableYearLevels.length
              ? `Year${availableYearLevels.length > 1 ? "s" : ""} ${availableYearLevels.join(" and ")} ${availableYearLevels.length > 1 ? "are" : "is"} open now. Other years are being written and are not offered yet.`
              : "No year level has approved content yet."}
          </p>
        </div>

        <fieldset className="grid gap-2.5">
          <legend className="text-base font-medium text-mm-ink">How they will sign in</legend>
          <p className="-mt-1 text-[13px] text-mm-muted">
            Children do not use an email address. We make a login code for them; you choose the PIN or let us pick one.
          </p>
          {(
            [
              { value: "generate", title: "Make a PIN for me", body: "A random 6-digit PIN, shown on the next screen" },
              { value: "choose", title: "I’ll choose it", body: "Exactly 6 digits" },
            ] as const
          ).map((o) => (
            <label
              key={o.value}
              className={twMerge(
                "flex min-h-[68px] cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3",
                pinMode === o.value ? "border-mm-brand bg-mm-tint-soft" : "border-mm-line bg-white",
              )}
            >
              <input
                type="radio"
                name="pin-mode"
                value={o.value}
                checked={pinMode === o.value}
                onChange={() => setPinMode(o.value)}
                className="h-5 w-5 accent-[var(--mm-brand)]"
              />
              <span>
                <span className="block text-[15px] font-semibold text-mm-ink">{o.title}</span>
                <span className="block text-[13px] text-mm-ink-soft">{o.body}</span>
              </span>
            </label>
          ))}
          {pinMode === "choose" && (
            <div className="grid gap-2">
              <label htmlFor="child-pin" className="text-sm font-semibold text-mm-ink">
                PIN
              </label>
              <input
                id="child-pin"
                className={twMerge(field, "max-w-[220px] font-mono tracking-[0.3em]", pFocus)}
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.currentTarget.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
              />
            </div>
          )}
        </fieldset>

        {error && (
          <p role="alert" className="rounded-xl bg-[#fdecec] px-4 py-3 text-sm font-medium text-[#b91c1c]">
            {error}
          </p>
        )}
        {duplicatePrompt && (
          <div role="alert" className="grid gap-3 rounded-xl bg-[#fdf3e4] px-4 py-3 text-sm text-[#92400e]">
            <p>{duplicatePrompt}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={pButtonSecondary} onClick={() => void submit(true)}>
                Yes, add another {trimmed}
              </button>
              <button type="button" className={pButtonQuiet} onClick={() => setDuplicatePrompt(null)}>
                Change the name
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <button type="submit" disabled={submitting} className={pButtonPrimary}>
            {submitting && <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />}
            {trimmed ? `Create ${trimmed}’s profile` : "Create profile"}
          </button>
          {laterHref && (
            <Link href={laterHref} className={pButtonQuiet}>
              I&rsquo;ll do this later
            </Link>
          )}
        </div>
        <p className="text-[13px] text-mm-muted">
          Nothing is created until we confirm it. The login code and PIN appear on the next screen.
        </p>
      </form>
    </Card>
  );
  return rail ? (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      {form}
      <aside className="grid gap-4">{rail}</aside>
    </div>
  ) : (
    form
  );
}
