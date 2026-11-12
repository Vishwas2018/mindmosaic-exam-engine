"use client";

import { useState } from "react";

import { Button } from "@/components/ui";
import { SignInCard } from "@/features/auth/components/SignInCard";

interface LoginCodeResponse {
  readonly ok: boolean;
  readonly loginCode?: string;
  readonly message?: string;
}

/**
 * "Show sign-in card" for one linked child. The login code is fetched from
 * the server only when asked for (and only a linked guardian is answered);
 * the PIN is deliberately absent because it is not stored anywhere
 * readable — the printed card leaves a line to write it on.
 */
export function ChildLoginCode({ childId, childName }: { childId: string; childName: string }) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; loginCode: string }
    | { status: "error"; message: string }
  >({ status: "idle" });

  async function reveal() {
    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/parent/children/${childId}`, { cache: "no-store" });
      const body = ((await response.json().catch(() => null)) as LoginCodeResponse | null) ?? { ok: false };
      if (response.ok && body.ok && body.loginCode) {
        setState({ status: "ready", loginCode: body.loginCode });
        return;
      }
      setState({
        status: "error",
        message: body.message ?? "We couldn’t load the login code. Please try again.",
      });
    } catch {
      setState({
        status: "error",
        message: "We couldn’t reach MindMosaic. Check your connection and try again.",
      });
    }
  }

  if (state.status === "ready") {
    return (
      <div className="px-1 pb-2">
        <SignInCard
          childName={childName}
          loginCode={state.loginCode}
          signInUrl={`${window.location.origin}/student-sign-in`}
        />
      </div>
    );
  }

  return (
    <div className="px-1 pb-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void reveal()}
        isLoading={state.status === "loading"}
        loadingLabel="Loading"
      >
        Sign-in card for {childName}
      </Button>
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-sm font-semibold text-error">
          {state.message}
        </p>
      )}
    </div>
  );
}
