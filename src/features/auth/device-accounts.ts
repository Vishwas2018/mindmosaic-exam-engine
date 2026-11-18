/**
 * Accounts a person has chosen to remember on THIS browser, so a shared
 * family computer can offer "Who's using MindMosaic?".
 *
 * Privacy rules, because this lives on a device other people use:
 *  - nothing is stored unless the signed-in person asks for it;
 *  - only a display name, a role and a year level are kept — never a
 *    password, PIN, token or e-mail address; the login code is not stored
 *    either, so picking someone still requires signing in;
 *  - "Sign everyone out" clears the list.
 */
import { isProfileRole, type ProfileRole } from "./roles";

const KEY = "mm.device-accounts";
const MAX_ACCOUNTS = 8;

export interface DeviceAccount {
  readonly id: string;
  readonly name: string;
  readonly role: ProfileRole;
  readonly yearLevel: number | null;
}

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isDeviceAccount(value: unknown): value is DeviceAccount {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.name === "string" &&
    v.name.length > 0 &&
    isProfileRole(v.role) &&
    (v.yearLevel === null || typeof v.yearLevel === "number")
  );
}

export function listDeviceAccounts(): DeviceAccount[] {
  try {
    const raw = store()?.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isDeviceAccount).slice(0, MAX_ACCOUNTS) : [];
  } catch {
    return [];
  }
}

function save(accounts: readonly DeviceAccount[]): void {
  try {
    store()?.setItem(KEY, JSON.stringify(accounts.slice(0, MAX_ACCOUNTS)));
  } catch {
    /* Storage unavailable: the list simply stays empty. */
  }
}

/** Adds (or refreshes) one account. The caller must only do this on the person's explicit request. */
export function rememberDeviceAccount(account: DeviceAccount): DeviceAccount[] {
  const next = [account, ...listDeviceAccounts().filter((existing) => existing.id !== account.id)];
  save(next);
  return next.slice(0, MAX_ACCOUNTS);
}

export function forgetDeviceAccount(id: string): DeviceAccount[] {
  const next = listDeviceAccounts().filter((account) => account.id !== id);
  save(next);
  return next;
}

export function clearDeviceAccounts(): void {
  try {
    store()?.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
