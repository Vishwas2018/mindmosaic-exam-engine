"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button, Input } from "@/components/ui";

import { useAuth } from "../AuthProvider";
import { roleHomePath } from "../roles";

interface Feedback {
  readonly tone: "error" | "success";
  readonly text: string;
}

/**
 * D1: the simplified student sign-in surface. No email field — a child only
 * ever sees their login code and PIN, both handed to them by a parent after
 * provisioning (see ../provision-child.ts). Internally this still resolves
 * to a normal signInWithPassword call (../AuthProvider.signInWithStudentCode),
 * the child just never sees that.
 */
export function StudentSignInCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitNext = searchParams.get("next");

  const auth = useAuth();
  const [loginCode, setLoginCode] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const canSubmit = loginCode.trim().length > 0 && pin.trim().length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setFeedback(null);

    const result = await auth.signInWithStudentCode(loginCode, pin);
    if (result.ok) {
      const destination = explicitNext ?? roleHomePath(await auth.fetchRole());
      router.push(destination);
      router.refresh();
      return;
    }
    setFeedback({ tone: "error", text: result.message ?? "Could not sign in." });
    setSubmitting(false);
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-black tracking-[-0.03em] text-ink">Student sign in</h1>
      <p className="mt-2 text-base text-muted">
        Enter the login code and PIN your parent gave you.
      </p>

      {!auth.configured && (
        <p className="mt-5 rounded-xl bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          Accounts aren&apos;t connected on this device yet.
        </p>
      )}

      {feedback && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          {feedback.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          id="student-login-code"
          label="Login code"
          autoComplete="off"
          value={loginCode}
          onChange={(e) => setLoginCode(e.currentTarget.value)}
        />
        <Input
          id="student-pin"
          label="PIN"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.currentTarget.value)}
        />

        <Button type="submit" variant="orange" size="lg" disabled={!canSubmit || submitting} className="mt-1 w-full">
          {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
          Sign in
        </Button>
      </form>

      <p className="mt-7 text-center text-sm font-semibold text-muted">
        Parent or teacher?{" "}
        <Link
          href="/sign-in"
          className="-my-3 inline-block py-3 font-bold text-royal hover:underline"
        >
          Sign in here
        </Link>
      </p>
    </div>
  );
}
