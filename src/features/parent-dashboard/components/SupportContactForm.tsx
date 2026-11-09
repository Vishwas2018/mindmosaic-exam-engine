"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, Send } from "lucide-react";

export function SupportContactForm() {
  const [name, setName] = useState("Priya Raman");
  const [email, setEmail] = useState("priya.raman@example.com");
  const [subject, setSubject] = useState("Question about a practice paper");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "confirmed" | "error">("idle");
  const [ticketRef, setTicketRef] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("submitting");
    setTimeout(() => {
      // Decision P13: Reference ID is displayed ONLY after receipt acknowledgment
      setTicketRef("TKT-84920");
      setStatus("confirmed");
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* State Preview Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-royal/10 bg-white/60 p-2.5 text-xs">
        <span className="font-semibold text-muted">Preview Contact State (b28-3):</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setTicketRef(null);
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              status === "idle" ? "bg-royal text-white" : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Form Initial
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus("confirmed");
              setTicketRef("TKT-84920");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              status === "confirmed" ? "bg-royal text-white" : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Confirmed with Ticket Ref (Decision P13)
          </button>
          <button
            type="button"
            onClick={() => setStatus("error")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              status === "error" ? "bg-royal text-white" : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Failed State
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 border-b border-royal/8 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="h-contact" className="text-xl font-bold text-ink">
              Send us a message
            </h2>
            <p className="text-xs text-muted">A real person reads every inquiry and replies by email.</p>
          </div>
        </div>

        {status === "confirmed" ? (
          <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-base font-bold text-emerald-900">Message received</h3>
                <p className="mt-0.5 text-xs text-emerald-800">
                  Your message has been acknowledged by our support service.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white p-4 shadow-2xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Your support reference
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-royal tracking-wider">
                {ticketRef}
              </p>
              <p className="mt-2 text-xs text-muted">
                We sent a receipt confirmation to <span className="font-semibold text-ink">{email}</span>. A team member typically replies within one Australian business day.
              </p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setMessage("");
                  setTicketRef(null);
                }}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
              >
                Send another message
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {status === "error" && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                <div>
                  <b className="font-semibold">We couldn&apos;t send your message.</b>
                  <p className="mt-0.5">
                    Nothing was sent. You can try again, or email us directly at{" "}
                    <a href="mailto:hello@mindmosaic.app" className="font-bold underline">
                      hello@mindmosaic.app
                    </a>
                    .
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ct-name" className="block text-xs font-semibold text-ink">
                  Your name
                </label>
                <input
                  id="ct-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-xl border border-royal/15 px-3 py-2 text-sm text-ink focus-visible:border-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                />
              </div>

              <div>
                <label htmlFor="ct-email" className="block text-xs font-semibold text-ink">
                  Email address
                </label>
                <input
                  id="ct-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-xl border border-royal/15 px-3 py-2 text-sm text-ink focus-visible:border-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ct-subject" className="block text-xs font-semibold text-ink">
                Topic
              </label>
              <select
                id="ct-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3 py-2 text-sm text-ink focus-visible:border-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
              >
                <option value="Question about a practice paper">Question about a practice paper</option>
                <option value="Student sign-in or PIN issue">Student sign-in or PIN issue</option>
                <option value="Writing assessment marking question">Writing assessment marking question</option>
                <option value="Billing or Family plan places">Billing or Family plan places</option>
                <option value="Data privacy or feedback">Data privacy or feedback</option>
              </select>
            </div>

            <div>
              <label htmlFor="ct-message" className="block text-xs font-semibold text-ink">
                How can we help?
              </label>
              <textarea
                id="ct-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Give us as much detail as you can..."
                required
                className="mt-1 block w-full rounded-xl border border-royal/15 px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus-visible:border-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-royal px-6 text-xs font-extrabold text-white shadow-sm transition hover:bg-royal-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 disabled:bg-zinc-300"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>{status === "submitting" ? "Sending..." : "Send message"}</span>
              </button>
              <p className="mt-2 text-[11px] text-muted">
                Reference ID is generated only after the server acknowledges receipt.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
