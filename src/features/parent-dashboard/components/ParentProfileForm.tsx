"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { useAuth } from "@/features/auth";
import { evaluatePassword } from "@/features/auth/password";
import { createClient } from "@/lib/supabase/client";

interface Notice {
  readonly ok: boolean;
  readonly text: string;
}

function NoticeLine({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return (
    <p
      role={notice.ok ? "status" : "alert"}
      className={`rounded-xl px-4 py-3 text-sm font-semibold ${
        notice.ok ? "bg-success/10 text-ink" : "bg-error/10 text-error"
      }`}
    >
      {notice.text}
    </p>
  );
}

/**
 * Edit the signed-in parent's own details: name, sign-in email and password.
 *
 * The name is written to both places it lives — auth user_metadata (what the
 * header reads, via the auth-state listener) and profiles.display_name (what
 * the rest of the app reads; `display_name` is in the authenticated column
 * grant, see 20260922100000_student_onboarding_preferences.sql). Email changes
 * go through Supabase's confirmation flow, so the address shown does not change
 * until the parent confirms from their inbox.
 */
export function ParentProfileForm() {
  const { user, displayName } = useAuth();
  const email = user?.email ?? "";

  const [name, setName] = useState(displayName ?? "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameNotice, setNameNotice] = useState<Notice | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailNotice, setEmailNotice] = useState<Notice | null>(null);

  const [password, setPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<Notice | null>(null);

  const passwordOk = evaluatePassword(password).allMet;

  async function saveName(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !user) return;
    setNameBusy(true);
    setNameNotice(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    });
    const { error: profileError } = authError
      ? { error: null }
      : await supabase.from("profiles").update({ display_name: trimmed }).eq("id", user.id);
    setNameBusy(false);
    if (authError || profileError) {
      setNameNotice({ ok: false, text: "Could not save your name. Please try again." });
      return;
    }
    setName(trimmed);
    setNameNotice({ ok: true, text: "Your name has been updated." });
  }

  async function saveEmail(event: FormEvent) {
    event.preventDefault();
    const trimmed = newEmail.trim();
    if (!trimmed || trimmed.toLowerCase() === email.toLowerCase()) return;
    setEmailBusy(true);
    setEmailNotice(null);
    const { error } = await createClient().auth.updateUser({ email: trimmed });
    setEmailBusy(false);
    if (error) {
      setEmailNotice({ ok: false, text: error.message });
      return;
    }
    setNewEmail("");
    setEmailNotice({
      ok: true,
      text: `We've sent a confirmation link to ${trimmed}. Your sign-in email changes once you confirm it.`,
    });
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (!passwordOk) return;
    setPasswordBusy(true);
    setPasswordNotice(null);
    const { error } = await createClient().auth.updateUser({ password });
    setPasswordBusy(false);
    if (error) {
      setPasswordNotice({ ok: false, text: error.message });
      return;
    }
    setPassword("");
    setPasswordNotice({ ok: true, text: "Your password has been updated." });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your name</CardTitle>
          <CardDescription>Shown in the header and on your parent dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveName} className="flex flex-col gap-4">
            <NoticeLine notice={nameNotice} />
            <Input
              id="parent-name"
              label="Full name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={nameBusy || !name.trim() || name.trim() === (displayName ?? "")}
              className="sm:self-start"
            >
              {nameBusy && <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />}
              Save name
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign-in email</CardTitle>
          <CardDescription>
            Currently <strong>{email || "—"}</strong>. A change takes effect after you confirm it by
            email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveEmail} className="flex flex-col gap-4">
            <NoticeLine notice={emailNotice} />
            <Input
              id="parent-new-email"
              label="New email address"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.currentTarget.value)}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={emailBusy || !newEmail.trim()}
              className="sm:self-start"
            >
              {emailBusy && <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />}
              Change email
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            At least 8 characters with upper and lower case, a number and a special character.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="flex flex-col gap-4">
            <NoticeLine notice={passwordNotice} />
            <Input
              id="parent-new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={passwordBusy || !passwordOk}
              className="sm:self-start"
            >
              {passwordBusy && <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
