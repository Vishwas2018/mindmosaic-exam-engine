"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  ArrowRight,
  KeyRound,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Clock,
  PauseCircle,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { MindMosaicLogo } from "@/components/branding";

export type AuthArtboardView =
  | "entry"
  | "parent-signin"
  | "parent-signup"
  | "check-inbox"
  | "reset-password"
  | "student-signin"
  | "student-states"
  | "session-expired"
  | "paused-profile";

export interface AuthPreviewScreensProps {
  initialView?: AuthArtboardView;
}

export function AuthPreviewScreens({ initialView = "entry" }: AuthPreviewScreensProps) {
  const [view, setView] = useState<AuthArtboardView>(initialView);

  // Parent form states
  const [parentEmail, setParentEmail] = useState("priya.raman@example.com");
  const [parentPassword, setParentPassword] = useState("••••••••••••");
  const [parentError, setParentError] = useState<string | null>(null);

  // Student form states
  const [studentCode, setStudentCode] = useState("K7XJ-2P9R");
  const [studentPin, setStudentPin] = useState("482901");
  const [studentStateVariant, setStudentStateVariant] = useState<
    "normal" | "wrong-code" | "wrong-pin" | "paused"
  >("normal");
  const [studentSuccess, setStudentSuccess] = useState(false);

  return (
    <div className="min-h-screen bg-[#fcfbf8] text-[#1f1b24] flex flex-col justify-between">
      {/* Top Banner & Artboard State Switcher */}
      <header className="border-b border-royal/10 bg-white shadow-xs">
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-center text-xs font-medium text-amber-900">
          <strong className="font-bold">Authentication Preview:</strong> Showing interactive design states from Claude Design export (b0–b19) in local preview mode. No credentials are transmitted or stored.
        </div>

        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <MindMosaicLogo size="sm" />
          </Link>

          {/* Artboard switcher pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-royal mr-1">Artboards:</span>
            <button
              type="button"
              onClick={() => {
                setView("entry");
                setStudentSuccess(false);
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                view === "entry" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Entry (b0–b2)
            </button>
            <button
              type="button"
              onClick={() => setView("parent-signin")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                view === "parent-signin" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Parent Sign-in (b3)
            </button>
            <button
              type="button"
              onClick={() => setView("parent-signup")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                view === "parent-signup" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Create Account (b4)
            </button>
            <button
              type="button"
              onClick={() => setView("check-inbox")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                view === "check-inbox" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Check Inbox (b9)
            </button>
            <button
              type="button"
              onClick={() => setView("reset-password")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                view === "reset-password" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Reset Password (b11)
            </button>
            <button
              type="button"
              onClick={() => {
                setView("student-signin");
                setStudentStateVariant("normal");
                setStudentSuccess(false);
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                view === "student-signin" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Student Sign-in (b14)
            </button>
            <button
              type="button"
              onClick={() => setView("student-states")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                view === "student-states" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Student States (b15)
            </button>
            <button
              type="button"
              onClick={() => setView("session-expired")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                view === "session-expired" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Session Expired (b18)
            </button>
            <button
              type="button"
              onClick={() => setView("paused-profile")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                view === "paused-profile" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Paused (b19)
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          {/* VIEW: ENTRY (b0 - b2) */}
          {view === "entry" && (
            <div className="space-y-8 text-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-royal">
                  One place for the whole family
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1f1b24] sm:text-4xl">
                  Welcome to MindMosaic
                </h1>
                <p className="mt-2 text-base text-[#6e6779]">
                  Choose how you want to sign in today.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-left">
                {/* Parent Choice */}
                <button
                  type="button"
                  onClick={() => setView("parent-signin")}
                  className="group rounded-2xl border border-royal/15 bg-white p-6 shadow-sm transition hover:border-royal hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-royal/10 text-royal transition group-hover:bg-royal group-hover:text-white">
                    <Users className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-[#1f1b24] group-hover:text-royal">
                    I&apos;m a parent
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#6e6779]">
                    Weekly practice overview, marking writing essays, and managing family plan places.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-royal">
                    <span>Parent sign-in</span>
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                </button>

                {/* Student Choice */}
                <button
                  type="button"
                  onClick={() => {
                    setView("student-signin");
                    setStudentStateVariant("normal");
                  }}
                  className="group rounded-2xl border border-royal/15 bg-white p-6 shadow-sm transition hover:border-royal hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-plum/10 text-plum transition group-hover:bg-plum group-hover:text-white">
                    <GraduationCap className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-[#1f1b24] group-hover:text-plum">
                    I&apos;m a student
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#6e6779]">
                    Use your 8-character login code and 6-digit secret PIN to practise questions and sit timed papers.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-plum">
                    <span>Student sign-in</span>
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                </button>
              </div>

              <div className="pt-2 text-xs text-[#6e6779]">
                New to MindMosaic?{" "}
                <button
                  type="button"
                  onClick={() => setView("parent-signup")}
                  className="font-bold text-royal underline underline-offset-2 hover:text-royal-deep"
                >
                  Start a 14-day Family trial
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PARENT SIGN-IN (b3, b6, b7) */}
          {view === "parent-signin" && (
            <div className="rounded-2xl border border-royal/10 bg-white p-7 shadow-sm space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-royal">Guardian portal</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1f1b24]">
                  Parent sign in
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Sign in with your guardian email and password.
                </p>
              </div>

              {parentError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{parentError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (parentPassword.length < 6) {
                    setParentError("Invalid password. Please check your details.");
                  } else {
                    setParentError(null);
                    window.location.href = "/parent";
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="p-email" className="block text-xs font-bold text-[#1f1b24]">
                    Email address
                  </label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6e6779]" />
                    <input
                      id="p-email"
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      required
                      className="block w-full rounded-xl border border-royal/15 bg-white py-2.5 pl-9 pr-3 text-sm text-[#1f1b24] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="p-pass" className="block text-xs font-bold text-[#1f1b24]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setView("reset-password")}
                      className="text-xs font-semibold text-royal hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6e6779]" />
                    <input
                      id="p-pass"
                      type="password"
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      required
                      className="block w-full rounded-xl border border-royal/15 bg-white py-2.5 pl-9 pr-3 text-sm text-[#1f1b24] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-11 rounded-xl bg-royal text-sm font-bold text-white transition hover:bg-royal-deep shadow-sm"
                >
                  Sign in to Family Workspace
                </button>
              </form>

              <div className="border-t border-royal/8 pt-4 flex flex-wrap items-center justify-between text-xs text-[#6e6779]">
                <span>Need a family account?</span>
                <button
                  type="button"
                  onClick={() => setView("parent-signup")}
                  className="font-bold text-royal hover:underline"
                >
                  Create account
                </button>
              </div>
            </div>
          )}

          {/* VIEW: CREATE ACCOUNT (b4, b8) */}
          {view === "parent-signup" && (
            <div className="rounded-2xl border border-royal/10 bg-white p-7 shadow-sm space-y-6">
              <div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  14-day free trial included
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1f1b24]">
                  Create your family account
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  One subscription covers up to 3 children across Years 3 and 5.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setView("check-inbox");
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-bold text-[#1f1b24]">
                    Your name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    defaultValue="Priya Raman"
                    required
                    className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3 py-2.5 text-sm text-[#1f1b24] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-bold text-[#1f1b24]">
                    Email address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    defaultValue="priya.raman@example.com"
                    required
                    className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3 py-2.5 text-sm text-[#1f1b24] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                  />
                </div>

                <div>
                  <label htmlFor="reg-pass" className="block text-xs font-bold text-[#1f1b24]">
                    Create password
                  </label>
                  <input
                    id="reg-pass"
                    type="password"
                    defaultValue="SecureP@ss2026"
                    required
                    className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3 py-2.5 text-sm text-[#1f1b24] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                  />
                  <p className="mt-1 text-[11px] text-[#6e6779]">
                    At least 8 characters with letters and numbers.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-11 rounded-xl bg-royal text-sm font-bold text-white transition hover:bg-royal-deep shadow-sm"
                >
                  Start 14-day Family trial
                </button>
              </form>

              <div className="border-t border-royal/8 pt-4 text-center text-xs text-[#6e6779]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setView("parent-signin")}
                  className="font-bold text-royal hover:underline"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* VIEW: CHECK INBOX (b9) */}
          {view === "check-inbox" && (
            <div className="rounded-2xl border border-royal/10 bg-white p-7 shadow-sm text-center space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
                <Mail className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1f1b24]">
                  Check your inbox
                </h1>
                <p className="mt-2 text-sm text-[#6e6779] max-w-sm mx-auto leading-relaxed">
                  We sent a confirmation link to <strong className="font-bold text-[#1f1b24]">priya.raman@example.com</strong>.
                  Click the link in that email to confirm your account and get started.
                </p>
              </div>

              <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4 text-xs text-[#6e6779] text-left space-y-1">
                <p className="font-bold text-[#1f1b24]">Didn&apos;t receive it?</p>
                <p>Check your spam or junk folder. Links remain valid for 24 hours.</p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => window.location.href = "/parent/setup"}
                  className="w-full min-h-11 rounded-xl bg-royal text-xs font-bold text-white transition hover:bg-royal-deep"
                >
                  Simulate Email Confirmed &rarr; Go to Setup
                </button>
                <button
                  type="button"
                  onClick={() => setView("parent-signin")}
                  className="text-xs font-semibold text-royal hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          )}

          {/* VIEW: RESET PASSWORD (b11, b12) */}
          {view === "reset-password" && (
            <div className="rounded-2xl border border-royal/10 bg-white p-7 shadow-sm space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1f1b24]">
                  Reset your password
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Enter your guardian email and we&apos;ll send you a password reset link.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Sample password reset link dispatched to " + parentEmail);
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="rst-email" className="block text-xs font-bold text-[#1f1b24]">
                    Email address
                  </label>
                  <input
                    id="rst-email"
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3 py-2.5 text-sm text-[#1f1b24] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-11 rounded-xl bg-royal text-sm font-bold text-white transition hover:bg-royal-deep shadow-sm"
                >
                  Send reset link
                </button>
              </form>

              <div className="border-t border-royal/8 pt-4 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setView("parent-signin")}
                  className="font-bold text-royal hover:underline"
                >
                  Return to sign in
                </button>
              </div>
            </div>
          )}

          {/* VIEW: STUDENT SIGN-IN (b14, b16) */}
          {(view === "student-signin" || view === "student-states") && (
            <div className="rounded-2xl border border-royal/10 bg-white p-7 shadow-sm space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-plum">Student sign in</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1f1b24]">
                  Sign in to practise
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Enter your 8-character login code and 6-digit PIN from your parent.
                </p>
              </div>

              {/* State variant simulator in preview */}
              {view === "student-states" && (
                <div className="rounded-xl border border-plum/20 bg-plum/5 p-3 text-xs space-y-2">
                  <span className="font-bold text-plum">Simulate student login state:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStudentStateVariant("normal")}
                      className={`rounded px-2 py-0.5 font-semibold ${
                        studentStateVariant === "normal" ? "bg-plum text-white" : "bg-white text-plum"
                      }`}
                    >
                      Valid Code &amp; PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStateVariant("wrong-code")}
                      className={`rounded px-2 py-0.5 font-semibold ${
                        studentStateVariant === "wrong-code" ? "bg-rose-600 text-white" : "bg-white text-rose-800"
                      }`}
                    >
                      Unknown Code (b15-1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStateVariant("wrong-pin")}
                      className={`rounded px-2 py-0.5 font-semibold ${
                        studentStateVariant === "wrong-pin" ? "bg-amber-600 text-white" : "bg-white text-amber-900"
                      }`}
                    >
                      Wrong PIN (b15-2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStateVariant("paused")}
                      className={`rounded px-2 py-0.5 font-semibold ${
                        studentStateVariant === "paused" ? "bg-slate-700 text-white" : "bg-white text-slate-800"
                      }`}
                    >
                      Paused Profile (b15-3)
                    </button>
                  </div>
                </div>
              )}

              {/* State feedback messages */}
              {studentStateVariant === "wrong-code" && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Login code not found.</span> Check the 8-character code with your parent.
                  </div>
                </div>
              )}

              {studentStateVariant === "wrong-pin" && (
                <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Incorrect PIN.</span> Ask your parent to reset your PIN from their Children tab if you&apos;ve forgotten it.
                  </div>
                </div>
              )}

              {studentStateVariant === "paused" && (
                <div role="alert" className="rounded-xl border border-slate-300 bg-slate-100 p-3 text-xs text-slate-800 flex items-start gap-2">
                  <PauseCircle className="h-4 w-4 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Practice paused.</span> Your profile is paused. Your parent can unpause your practice at any time.
                  </div>
                </div>
              )}

              {studentSuccess && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Signed in as Aisha Raman (Year 3).</span> Redirecting to My Space...
                  </div>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (studentStateVariant === "normal") {
                    setStudentSuccess(true);
                    setTimeout(() => {
                      window.location.href = "/student";
                    }, 800);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="st-code" className="block text-xs font-bold text-[#1f1b24]">
                    8-character login code
                  </label>
                  <input
                    id="st-code"
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    maxLength={9}
                    placeholder="K7XJ-2P9R"
                    className="mt-1 block w-full font-mono text-center text-lg font-bold tracking-widest rounded-xl border border-royal/15 bg-white py-2.5 text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                  />
                  <p className="mt-1 text-[11px] text-[#6e6779]">Format: 4 letters, hyphen, 4 letters</p>
                </div>

                <div>
                  <label htmlFor="st-pin" className="block text-xs font-bold text-[#1f1b24]">
                    6-digit secret PIN
                  </label>
                  <input
                    id="st-pin"
                    type="password"
                    maxLength={6}
                    value={studentPin}
                    onChange={(e) => setStudentPin(e.target.value)}
                    placeholder="••••••"
                    className="mt-1 block w-full font-mono text-center text-xl tracking-[0.4em] font-extrabold rounded-xl border border-royal/15 bg-white py-2.5 text-[#1f1b24] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                  />
                </div>

                <button
                  type="submit"
                  disabled={studentStateVariant === "paused"}
                  className="w-full min-h-11 rounded-xl bg-plum text-sm font-bold text-white transition hover:bg-plum-deep disabled:opacity-50 shadow-sm"
                >
                  Sign in to practise
                </button>
              </form>

              <div className="border-t border-royal/8 pt-4 flex flex-wrap items-center justify-between text-xs text-[#6e6779]">
                <span>Can&apos;t sign in?</span>
                <button
                  type="button"
                  onClick={() => alert("Ask your parent to check your profile under their Children tab in the MindMosaic parent workspace.")}
                  className="font-bold text-plum hover:underline"
                >
                  Help getting signed in
                </button>
              </div>
            </div>
          )}

          {/* VIEW: SESSION EXPIRED (b18) */}
          {view === "session-expired" && (
            <div className="rounded-2xl border border-royal/10 bg-white p-7 shadow-sm text-center space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700">
                <Clock className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1f1b24]">
                  Your session has expired
                </h1>
                <p className="mt-2 text-sm text-[#6e6779] max-w-sm mx-auto leading-relaxed">
                  For your security, MindMosaic signs out inactive accounts after a period of time. Please sign in again to continue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView("entry")}
                className="w-full min-h-11 rounded-xl bg-royal text-sm font-bold text-white transition hover:bg-royal-deep shadow-sm"
              >
                Sign in again
              </button>
            </div>
          )}

          {/* VIEW: PAUSED OR UNAVAILABLE (b19) */}
          {view === "paused-profile" && (
            <div className="rounded-2xl border border-royal/10 bg-white p-7 shadow-sm text-center space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-700">
                <PauseCircle className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1f1b24]">
                  Practice is currently paused
                </h1>
                <p className="mt-2 text-sm text-[#6e6779] max-w-sm mx-auto leading-relaxed">
                  Your parent has paused this profile. None of your marks or finished papers have been changed, but practice is paused for now.
                </p>
              </div>
              <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4 text-xs text-[#6e6779] text-left">
                Ask your parent to unpause your place from their Children dashboard when you are ready to practise again.
              </div>
              <button
                type="button"
                onClick={() => setView("entry")}
                className="w-full min-h-11 rounded-xl bg-royal text-sm font-bold text-white transition hover:bg-royal-deep shadow-sm"
              >
                Back to sign in entry
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-royal/8 bg-white py-4 px-4 text-center text-xs text-[#6e6779]">
        MindMosaic Educational Practice &middot; Grade 3 &amp; Grade 5 Australian Curriculum
      </footer>
    </div>
  );
}
