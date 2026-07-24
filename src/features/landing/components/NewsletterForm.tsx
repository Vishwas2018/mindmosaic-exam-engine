"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { footer } from "../content";

/** No real signup exists yet — submitting shows an inline, accessible confirmation instead of sending anywhere. */
export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mt-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
        className="flex gap-2"
      >
        <label htmlFor="footer-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-email"
          type="email"
          required
          placeholder={footer.newsletter.placeholder}
          className="min-h-11 w-full min-w-0 rounded-xl border border-white/15 bg-white/10 px-3.5 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-bright/40"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-bright text-white transition hover:bg-brand"
        >
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </form>
      <p role="status" aria-live="polite" className="mt-2 min-h-4 text-xs font-semibold text-brand-bright">
        {submitted ? footer.newsletter.comingSoonMessage : ""}
      </p>
    </div>
  );
}
