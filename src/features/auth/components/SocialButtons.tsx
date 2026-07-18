"use client";

import { useState, type ReactNode } from "react";

import { useAuth, type OAuthProvider } from "../AuthProvider";

interface ProviderDef {
  readonly id: OAuthProvider;
  readonly label: string;
  readonly icon: ReactNode;
}

const PROVIDERS: readonly ProviderDef[] = [
  {
    id: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-3l-3.9-3c-1 .7-2.4 1.1-4 1.1-3 0-5.6-2-6.5-4.8H1.5v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.5 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.5a12 12 0 0 0 0 10.8l4-3.1Z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.5 6.6l4 3.1C6.4 6.8 9 4.8 12 4.8Z" />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8ZM14.3 5.9c.6-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3Z" />
      </svg>
    ),
  },
  {
    id: "azure",
    label: "Microsoft",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
        <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
        <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
        <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2" aria-hidden="true">
        <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.4 0-1.9.9-1.9 1.8V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12Z" />
      </svg>
    ),
  },
];

export function SocialButtons({ nextPath = "/" }: { nextPath?: string }) {
  const { signInWithOAuth } = useAuth();
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (provider: OAuthProvider) => {
    setError(null);
    setPending(provider);
    const result = await signInWithOAuth(provider, nextPath);
    if (!result.ok) {
      setError(result.message ?? "That sign-in method isn't available yet.");
      setPending(null);
    }
    // On success the browser redirects to the provider; no need to reset.
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handle(provider.id)}
            disabled={pending !== null}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-royal/15 bg-white px-4 py-3 text-sm font-bold text-ink shadow-[0_2px_8px_rgba(49,32,86,0.04)] transition hover:-translate-y-0.5 hover:border-royal/30 hover:bg-soft-purple focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 disabled:pointer-events-none disabled:opacity-50"
          >
            {provider.icon}
            <span>{pending === provider.id ? "Redirecting…" : provider.label}</span>
          </button>
        ))}
      </div>
      {error && (
        <p role="status" className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-sm font-semibold text-warning">
          {error}
        </p>
      )}
    </div>
  );
}
