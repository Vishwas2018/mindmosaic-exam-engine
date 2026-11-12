"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

import { useAuth } from "../AuthProvider";
import {
  clearDeviceAccounts,
  forgetDeviceAccount,
  listDeviceAccounts,
  rememberDeviceAccount,
  type DeviceAccount,
} from "../device-accounts";
import { mmAuthButton, mmFocus } from "./auth-fields";

function roleLine(account: DeviceAccount, isCurrent: boolean): string {
  const what =
    account.role === "student"
      ? account.yearLevel !== null
        ? `Year ${account.yearLevel}`
        : "Student"
      : account.role === "parent"
        ? "Parent"
        : account.role === "teacher"
          ? "Teacher"
          : "Admin";
  return isCurrent ? `${what} · signed in` : `${what} · sign in again to switch`;
}

/**
 * "Who's using MindMosaic?" Only one account is active in a browser at a
 * time, and choosing someone else always ends with that person signing in:
 * nothing here holds a password, PIN or token. The list contains only
 * accounts the person asked to remember on this device.
 */
export function SwitchAccountScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [remembered, setRemembered] = useState<DeviceAccount[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemembered(listDeviceAccounts());
  }, []);

  const current: DeviceAccount | null =
    auth.status === "authenticated" && auth.user && auth.role
      ? {
          id: auth.user.id,
          name: auth.displayName ?? "This account",
          role: auth.role,
          yearLevel: null,
        }
      : null;
  const currentIsRemembered = current ? remembered.some((a) => a.id === current.id) : false;
  const others = remembered.filter((account) => account.id !== current?.id);

  async function pick(account: DeviceAccount) {
    await auth.signOut();
    router.push(account.role === "student" ? "/student-sign-in" : "/sign-in");
    router.refresh();
  }

  async function signEveryoneOut() {
    clearDeviceAccounts();
    await auth.signOut();
    router.push("/signed-out");
    router.refresh();
  }

  return (
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
      <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
        <h1 className="text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
          Who&apos;s using MindMosaic?
        </h1>
        <p className="mt-2 text-sm leading-[1.5] text-mm-muted">
          Pick an account to sign in to on this device.
        </p>

        <ul className="mt-6 grid gap-3">
          {current && (
            <li className="flex items-center justify-between gap-3 rounded-xl border border-mm-tint-line bg-mm-tint p-3.5">
              <span>
                <span className="block font-bold text-mm-ink">{current.name}</span>
                <span className="block text-sm text-mm-muted">{roleLine(current, true)}</span>
              </span>
              {!currentIsRemembered && (
                <button
                  type="button"
                  onClick={() => setRemembered(rememberDeviceAccount(current))}
                  className={twMerge(
                    "inline-flex min-h-11 items-center rounded px-2 text-sm font-bold text-mm-brand hover:underline",
                    mmFocus,
                  )}
                >
                  Remember on this device
                </button>
              )}
            </li>
          )}
          {others.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-mm-line p-3.5"
            >
              <button
                type="button"
                onClick={() => void pick(account)}
                className={twMerge("min-h-11 flex-1 rounded text-left", mmFocus)}
              >
                <span className="block font-bold text-mm-ink">{account.name}</span>
                <span className="block text-sm text-mm-muted">{roleLine(account, false)}</span>
              </button>
              <button
                type="button"
                onClick={() => setRemembered(forgetDeviceAccount(account.id))}
                aria-label={`Forget ${account.name} on this device`}
                className={twMerge(
                  "inline-flex min-h-11 items-center rounded px-2 text-sm font-semibold text-mm-muted hover:underline",
                  mmFocus,
                )}
              >
                Forget
              </button>
            </li>
          ))}
        </ul>

        <Link href="/welcome" className={mmAuthButton({ variant: "outline", className: "mt-4 w-full" })}>
          Use a different account
        </Link>

        <p className="mt-6 text-[13px] leading-[1.5] text-mm-muted">
          Only one account is active in a browser at a time, and each person signs in themselves.
          Names are kept on this device only if you ask, and are cleared when you sign everyone out.
        </p>

        <section aria-labelledby="shared-finish" className="mt-6 border-t border-mm-line pt-5">
          <h2 id="shared-finish" className="text-base font-bold text-mm-ink">
            Finished on a shared computer?
          </h2>
          <button
            type="button"
            onClick={() => void signEveryoneOut()}
            className={mmAuthButton({ variant: "outline", className: "mt-3 w-full" })}
          >
            Sign everyone out
          </button>
        </section>
      </div>
    </main>
  );
}
